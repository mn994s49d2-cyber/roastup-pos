import { Order, PrinterConfig } from '../types';
import { 
  getOrderPlacedTime, 
  getOrderDueTime, 
  resolveTimeOfDay, 
  formatPreOrderNotes 
} from './orderTime';

// Bluetooth GATT Service and Characteristic UUIDs commonly used by ESC/POS receipt printers
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard ESC/POS service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Star Micronics
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent serial
  '0000e0ff-3c17-d293-8e48-14fe2e4da212'  // Generic thermal serial
];

class HardwareService {
  private bluetoothDevice: any = null;
  private printCharacteristic: any = null;
  private isConnecting: boolean = false;

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getConnectedDeviceName(): string | null {
    return this.bluetoothDevice ? this.bluetoothDevice.name || 'Bluetooth Printer' : null;
  }

  public isBluetoothConnected(): boolean {
    return !!this.bluetoothDevice && !!this.printCharacteristic;
  }

  /**
   * Request Bluetooth device pair
   */
  public async connectBluetoothPrinter(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!this.isBluetoothSupported()) {
      return { success: false, error: 'Web Bluetooth is not supported in this browser. Use Chrome or Edge.' };
    }

    try {
      this.isConnecting = true;
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES
      });

      this.bluetoothDevice = device;
      
      device.addEventListener('gattserverdisconnected', () => {
        this.printCharacteristic = null;
        console.warn('Bluetooth printer disconnected');
      });

      const server = await device.gatt.connect();
      
      // Find writable characteristic
      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.printCharacteristic = char;
              break;
            }
          }
          if (this.printCharacteristic) break;
        } catch {
          // Continue to next candidate service
        }
      }

      this.isConnecting = false;
      return {
        success: true,
        deviceName: device.name || 'Thermal Receipt Printer'
      };
    } catch (err: any) {
      this.isConnecting = false;
      return {
        success: false,
        error: err?.message || 'Bluetooth connection was cancelled or timed out.'
      };
    }
  }

  public disconnectBluetooth(): void {
    if (this.bluetoothDevice && this.bluetoothDevice.gatt?.connected) {
      this.bluetoothDevice.gatt.disconnect();
    }
    this.bluetoothDevice = null;
    this.printCharacteristic = null;
  }

  /**
   * Print an order receipt
   */
  public async printOrderReceipt(order: Order, config?: PrinterConfig): Promise<{ success: boolean; message: string }> {
    const width = config?.paperWidth || 80;
    const mode = config?.type || 'browser';

    // If bluetooth is connected and preferred, try sending ESC/POS bytes
    if (mode === 'bluetooth' && this.isBluetoothConnected() && this.printCharacteristic) {
      try {
        const escposBytes = this.generateEscPosBytes(order, width);
        // Send in 512-byte chunks to prevent GATT buffer overflow
        const chunkSize = 256;
        for (let i = 0; i < escposBytes.length; i += chunkSize) {
          const chunk = escposBytes.slice(i, i + chunkSize);
          await this.printCharacteristic.writeValue(chunk);
        }
        return { success: true, message: 'Printed to Bluetooth thermal printer' };
      } catch (err: any) {
        console.warn('Bluetooth print failed, falling back to browser print:', err);
      }
    }

    // Standard high-resolution browser thermal slip print (works on all USB, LAN, Bluetooth, and system printers)
    this.printViaBrowserFrame(order, width);
    return { success: true, message: 'Sent to receipt printer' };
  }

  /**
   * Print a test ticket
   */
  public async printTestTicket(config?: PrinterConfig): Promise<{ success: boolean; message: string }> {
    const testOrder: Order = {
      id: 'test-print',
      orderNumber: 999,
      timestamp: new Date().toISOString(),
      type: 'takeaway',
      items: [
        {
          cartItemId: 't1',
          menuItemId: 'test-1',
          name: 'The OG Loaded (Test)',
          category: 'Loaded Roast Potatoes',
          variation: { id: 'v-m', name: 'Medium', sku: 'TST-001', price: 6.50 },
          selectedModifiers: [
            { setId: 's1', setName: 'Extra', optionId: 'o1', optionName: 'Crispy Bits', priceDelta: 0 }
          ],
          unitPrice: 6.50,
          quantity: 1,
          totalPrice: 6.50,
          specialAdditions: ['Extra Crispy Test']
        },
        {
          cartItemId: 't2',
          menuItemId: 'test-2',
          name: 'Fresh Rosemary Gravy Tub',
          category: 'Sauces & Dips',
          variation: { id: 'v-g', name: 'Standard', sku: 'TST-002', price: 1.20 },
          selectedModifiers: [],
          unitPrice: 1.20,
          quantity: 1,
          totalPrice: 1.20
        }
      ],
      subtotal: 6.42,
      tax: 1.28,
      total: 7.70,
      status: 'completed',
      paymentMethod: 'contactless',
      paymentStatus: 'paid',
      cardBrand: 'Apple Pay',
      cardLast4: '0042',
      customerName: 'Hardware Test'
    };

    return this.printOrderReceipt(testOrder, config);
  }

  /**
   * Generates standard ESC/POS binary data for 58mm/80mm thermal receipt printers
   */
  private generateEscPosBytes(order: Order, widthCols: 58 | 80): Uint8Array {
    const encoder = new TextEncoder();
    const parts: number[] = [];

    const pushBytes = (bytes: number[]) => parts.push(...bytes);
    const pushStr = (str: string) => {
      const b = encoder.encode(str);
      for (let i = 0; i < b.length; i++) parts.push(b[i]);
    };

    // ESC @ - Initialize
    pushBytes([0x1B, 0x40]);
    // Center alignment
    pushBytes([0x1B, 0x61, 0x01]);

    // Title: Bold Double Size
    pushBytes([0x1B, 0x21, 0x30]);
    pushStr("ROASTUP\n");
    pushBytes([0x1B, 0x21, 0x00]);
    pushStr("Crispy Loaded Roast Potatoes\n");
    pushStr("100% British Maris Piper\n\n");

    const ticketNum = order.ticketNumber || `A-${order.orderNumber}`;
    const placedTime = getOrderPlacedTime(order);
    const dueTime = order.dueTime || getOrderDueTime(order);
    const timeOfDay = order.timeOfDay || resolveTimeOfDay(order.dueAt);
    const formattedNotes = formatPreOrderNotes(order.notes || order.customerNotes, dueTime, timeOfDay);

    // Large Ticket & Order Number
    pushBytes([0x1B, 0x21, 0x20]);
    pushStr(`TICKET ${ticketNum}\n`);
    pushBytes([0x1B, 0x21, 0x00]);
    pushStr(`Order #${order.orderNumber} - ${order.type === 'dine_in' ? 'DINE IN' : 'TAKEAWAY'}\n`);
    
    if (order.isPreOrder) {
      pushBytes([0x1B, 0x45, 0x01]);
      pushStr(`*** PRE-ORDER DUE: ${dueTime} (${timeOfDay.toUpperCase()}) ***\n`);
      if (order.pickupTime) {
        pushStr(`${order.pickupTime}\n`);
      }
      pushBytes([0x1B, 0x45, 0x00]);
    } else {
      pushStr(`Placed: ${placedTime}  |  Due: ${dueTime}\n`);
    }

    if (order.tableNumber) {
      pushStr(`TABLE: ${order.tableNumber}\n`);
    }
    if (order.customerName) {
      pushStr(`GUEST: ${order.customerName}\n`);
    }

    const divider = widthCols === 58 ? '--------------------------------\n' : '------------------------------------------------\n';
    pushStr(divider);

    // Prominent Kitchen Notes (with pre-order due banner)
    if (formattedNotes && (order.notes || order.customerNotes || order.isPreOrder)) {
      pushBytes([0x1B, 0x45, 0x01]); // Bold on
      pushStr(`NOTE: ${formattedNotes}\n`);
      pushBytes([0x1B, 0x45, 0x00]); // Bold off
      pushStr(divider);
    }

    // Left alignment for items
    pushBytes([0x1B, 0x61, 0x00]);
    order.items.forEach(item => {
      pushBytes([0x1B, 0x45, 0x01]); // Bold on
      pushStr(`${item.quantity}x ${item.name} (${item.variation.name})\n`);
      pushBytes([0x1B, 0x45, 0x00]); // Bold off

      if (item.selectedModifiers && item.selectedModifiers.length > 0) {
        item.selectedModifiers.forEach(m => {
          pushStr(`   + ${m.optionName}\n`);
        });
      }
      if (item.specialAdditions && item.specialAdditions.length > 0) {
        item.specialAdditions.forEach(a => pushStr(`   * ${a}\n`));
      }
      if (item.specialRemovals && item.specialRemovals.length > 0) {
        item.specialRemovals.forEach(r => pushStr(`   - ${r}\n`));
      }
      pushStr(`   Price: GBP ${item.totalPrice.toFixed(2)}\n`);
    });

    pushStr(divider);

    // Totals
    pushStr(`Subtotal:          GBP ${order.subtotal.toFixed(2)}\n`);
    pushStr(`VAT (20%):         GBP ${order.tax.toFixed(2)}\n`);
    pushBytes([0x1B, 0x45, 0x01]);
    pushBytes([0x1B, 0x21, 0x10]); // Double height
    pushStr(`TOTAL:             GBP ${order.total.toFixed(2)}\n`);
    pushBytes([0x1B, 0x21, 0x00]);
    pushBytes([0x1B, 0x45, 0x00]);

    pushStr(divider);
    // Payment details
    pushStr(`Payment: ${order.paymentMethod || 'Card Terminal'} (${order.paymentStatus.toUpperCase()})\n`);
    if (order.cardBrand && order.cardLast4) {
      pushStr(`Card: ${order.cardBrand} ****${order.cardLast4}\n`);
    }
    pushStr(`Date: ${new Date(order.timestamp).toLocaleString('en-GB')}\n`);

    // Loyalty Details
    if (order.loyaltyInfo) {
      pushStr(divider);
      pushBytes([0x1B, 0x45, 0x01]);
      pushStr("ROASTUP LOYALTY CLUB\n");
      pushBytes([0x1B, 0x45, 0x00]);
      pushStr(`Member ID: ${order.loyaltyInfo.memberId}\n`);
      if (order.loyaltyInfo.memberName) {
        pushStr(`Member: ${order.loyaltyInfo.memberName}\n`);
      }
      if (order.loyaltyInfo.pointsRedeemed) {
        pushStr(`Points Redeemed: ${order.loyaltyInfo.pointsRedeemed} pts (-GBP ${(order.loyaltyInfo.discountValue || 0).toFixed(2)})\n`);
      }
      if (order.loyaltyInfo.pointsEarned) {
        pushStr(`Points Earned: +${order.loyaltyInfo.pointsEarned} pts\n`);
      }
      if (order.loyaltyInfo.newPoints !== undefined) {
        pushStr(`New Point Balance: ${order.loyaltyInfo.newPoints} pts\n`);
      }
      pushStr("Scan QR on app to check perks\n");
    }
    pushStr("\n");

    // Center alignment for footer
    pushBytes([0x1B, 0x61, 0x01]);
    pushStr("Thank you for choosing ROASTUP!\n");
    pushStr("roastup.co.uk\n\n\n\n");

    // Paper cut command: GS V 65 3
    pushBytes([0x1D, 0x56, 0x41, 0x03]);

    return new Uint8Array(parts);
  }

  /**
   * Browser formatted thermal slip print
   */
  private printViaBrowserFrame(order: Order, paperWidth: 58 | 80): void {
    if (typeof window === 'undefined') return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const widthCss = paperWidth === 58 ? '54mm' : '72mm';
    const ticketNum = order.ticketNumber || `A-${order.orderNumber}`;
    const placedTime = getOrderPlacedTime(order);
    const dueTime = order.dueTime || getOrderDueTime(order);
    const timeOfDay = order.timeOfDay || resolveTimeOfDay(order.dueAt);
    const formattedNotes = formatPreOrderNotes(order.notes || order.customerNotes, dueTime, timeOfDay);

    const itemsHtml = order.items.map(item => `
      <div style="margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 13px;">
          <span>${item.quantity}x ${item.name} (${item.variation.name})</span>
          <span>£${item.totalPrice.toFixed(2)}</span>
        </div>
        ${item.selectedModifiers && item.selectedModifiers.length > 0 ? `
          <div style="font-size: 10px; color: #444; padding-left: 10px; margin-top: 2px;">
            ${item.selectedModifiers.map(m => `<div>+ ${m.optionName}</div>`).join('')}
          </div>
        ` : ''}
        ${item.specialRemovals && item.specialRemovals.length > 0 ? `
          <div style="font-size: 10px; color: #b91c1c; font-weight: bold; padding-left: 10px;">
            ${item.specialRemovals.map(r => `<div>NO: ${r}</div>`).join('')}
          </div>
        ` : ''}
        ${item.specialAdditions && item.specialAdditions.length > 0 ? `
          <div style="font-size: 10px; color: #15803d; font-weight: bold; padding-left: 10px;">
            ${item.specialAdditions.map(a => `<div>EXTRA: ${a}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ROASTUP Receipt #${order.orderNumber}</title>
          <style>
            @page {
              margin: 0;
              size: ${paperWidth}mm auto;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: ${widthCss};
              margin: 0 auto;
              padding: 10px 4px;
              color: #000;
              background: #fff;
              font-size: 11px;
              line-height: 1.3;
            }
            .center { text-align: center; }
            .bold { font-weight: 900; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .order-badge {
              font-size: 26px;
              font-weight: 900;
              text-align: center;
              margin: 6px 0;
              letter-spacing: -1px;
            }
            .type-badge {
              display: inline-block;
              font-size: 12px;
              font-weight: bold;
              padding: 2px 8px;
              border: 1px solid #000;
              margin-bottom: 6px;
            }
            .row { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="center">
            <div style="font-size: 20px; font-weight: 900; letter-spacing: 1px;">ROASTUP</div>
            <div style="font-size: 10px;">100% British Maris Piper Potatoes</div>
            <div style="font-size: 10px;">VAT Reg: GB 984 2108 55</div>
            <div class="divider"></div>
            <div class="order-badge">${ticketNum}</div>
            <div style="font-size: 13px; font-weight: bold; margin-bottom: 2px;">Order #${order.orderNumber}</div>
            <div class="type-badge">${order.type === 'dine_in' ? 'DINE IN' : 'TAKEAWAY'}</div>
            ${order.tableNumber ? `<div style="font-weight: bold;">Table ${order.tableNumber}</div>` : ''}
            ${order.customerName ? `<div>Guest: ${order.customerName}</div>` : ''}
            
            ${order.isPreOrder ? `
              <div style="background: #000; color: #fff; padding: 4px; font-size: 11px; font-weight: 900; margin: 4px 0;">
                ★ PRE-ORDER DUE: ${dueTime} (${timeOfDay.toUpperCase()}) ★
              </div>
              <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">${order.pickupTime || `Pickup: Today at ${dueTime}`}</div>
            ` : `
              <div style="font-size: 10px; font-weight: bold; margin: 3px 0;">Placed: ${placedTime} • Due: ${dueTime}</div>
            `}
            <div style="font-size: 9px; color: #555;">${new Date(order.timestamp).toLocaleString('en-GB')}</div>
          </div>

          ${formattedNotes && (order.notes || order.customerNotes || order.isPreOrder) ? `
            <div style="border: 2px dashed #000; padding: 6px; margin: 6px 0; background: #f8f8f8; text-align: left; font-size: 11px; font-weight: bold;">
              <div style="font-size: 9px; text-transform: uppercase; color: #444; margin-bottom: 2px;">Kitchen Ticket Note:</div>
              <div>${formattedNotes}</div>
            </div>
          ` : ''}

          <div class="divider"></div>
          <div>${itemsHtml}</div>
          <div class="divider"></div>

          <div class="row" style="font-size: 11px;">
            <span>Subtotal (Net):</span>
            <span>£${order.subtotal.toFixed(2)}</span>
          </div>
          <div class="row" style="font-size: 11px;">
            <span>VAT (20%):</span>
            <span>£${order.tax.toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <div class="row" style="font-size: 16px; font-weight: 900;">
            <span>TOTAL:</span>
            <span>£${order.total.toFixed(2)}</span>
          </div>
          <div class="divider"></div>

          <div style="font-size: 10px;">
            <div class="row">
              <span>Payment:</span>
              <span style="font-weight: bold;">${order.paymentMethod || 'Card'} (${order.paymentStatus.toUpperCase()})</span>
            </div>
            ${order.cardBrand ? `
              <div class="row">
                <span>Method:</span>
                <span>${order.cardBrand} ${order.cardLast4 ? '****' + order.cardLast4 : ''}</span>
              </div>
            ` : ''}
            ${order.paymentRef ? `
              <div class="row" style="font-size: 9px; color: #666;">
                <span>Ref:</span>
                <span>${order.paymentRef}</span>
              </div>
            ` : ''}
          </div>

          ${order.loyaltyInfo ? `
            <div class="divider"></div>
            <div style="font-size: 10px; margin: 4px 0; padding: 6px; border: 1px dashed #000; border-radius: 4px;">
              <div class="center bold" style="font-size: 11px; margin-bottom: 4px; letter-spacing: 0.5px;">ROASTUP LOYALTY CLUB</div>
              <div class="row"><span>Member ID:</span><span class="bold">${order.loyaltyInfo.memberId}</span></div>
              ${order.loyaltyInfo.memberName ? `<div class="row"><span>Member:</span><span>${order.loyaltyInfo.memberName}</span></div>` : ''}
              ${order.loyaltyInfo.pointsRedeemed ? `<div class="row"><span>Points Redeemed:</span><span class="bold">-${order.loyaltyInfo.pointsRedeemed} pts (-£${(order.loyaltyInfo.discountValue || 0).toFixed(2)})</span></div>` : ''}
              ${order.loyaltyInfo.pointsEarned ? `<div class="row"><span>Points Earned:</span><span class="bold">+${order.loyaltyInfo.pointsEarned} pts</span></div>` : ''}
              ${order.loyaltyInfo.newPoints !== undefined ? `<div class="row" style="margin-top: 3px; font-weight: bold; border-top: 1px dotted #888; padding-top: 2px;"><span>New Point Balance:</span><span>${order.loyaltyInfo.newPoints} pts</span></div>` : ''}
              <div class="center" style="margin-top: 6px;">
                <div style="display: inline-block; padding: 4px; background: #fff; border: 1px solid #000; border-radius: 3px;">
                  <svg width="64" height="64" viewBox="0 0 100 100" style="display:block; margin: 0 auto;">
                    <rect width="100" height="100" fill="#fff"/>
                    <rect x="10" y="10" width="30" height="30" fill="#000"/>
                    <rect x="15" y="15" width="20" height="20" fill="#fff"/>
                    <rect x="20" y="20" width="10" height="10" fill="#000"/>
                    <rect x="60" y="10" width="30" height="30" fill="#000"/>
                    <rect x="65" y="15" width="20" height="20" fill="#fff"/>
                    <rect x="70" y="20" width="10" height="10" fill="#000"/>
                    <rect x="10" y="60" width="30" height="30" fill="#000"/>
                    <rect x="15" y="65" width="20" height="20" fill="#fff"/>
                    <rect x="20" y="70" width="10" height="10" fill="#000"/>
                    <rect x="45" y="20" width="10" height="20" fill="#000"/>
                    <rect x="60" y="55" width="15" height="15" fill="#000"/>
                    <rect x="80" y="75" width="10" height="15" fill="#000"/>
                    <rect x="45" y="60" width="10" height="30" fill="#000"/>
                  </svg>
                </div>
                <div style="font-size: 8px; color: #555; margin-top: 2px;">Scan with Roastup App to check perks</div>
              </div>
            </div>
          ` : ''}

          <div class="divider"></div>
          <div class="center" style="font-size: 10px; margin-top: 10px;">
            <div>Thank you for roasting with us!</div>
            <div style="font-weight: bold; margin-top: 3px;">roastup.co.uk</div>
            <div style="font-size: 8px; color: #777; margin-top: 4px;">Freshly roasted every single hour</div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 250);
  }
}

export const hardware = new HardwareService();
