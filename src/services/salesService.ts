import { getDatabase } from '../database/database';
import { PaymentType, SalesAnalytics, DepositSchedule } from '../types';

export class SalesService {
  // 영업일 계산 (주말 제외)
  static addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      // 주말이 아닌 경우에만 카운트
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++;
      }
    }

    return result;
  }

  // 결제 유형별 입금 예정일 계산
  static calculateExpectedDepositDate(orderDate: string, paymentType: PaymentType): string {
    const orderDateObj = new Date(orderDate);
    let businessDays = 0;

    switch (paymentType) {
      case 'CARD':
        businessDays = 2;
        break;
      case 'COUPANG':
      case 'BAEMIN':
      case 'YOGIYO':
        businessDays = 5;
        break;
      default:
        businessDays = 2;
    }

    const expectedDate = this.addBusinessDays(orderDateObj, businessDays);
    return expectedDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  }

  // 매출 분석 데이터 조회
  static getSalesAnalytics(): SalesAnalytics {
    const db = getDatabase();

    // 전체 매출
    const totalSalesStmt = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM orders
    `);
    totalSalesStmt.step();
    const totalSales = totalSalesStmt.getAsObject() as { total: number };
    totalSalesStmt.free();

    // 입금 대기 금액
    const pendingStmt = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as pending
      FROM orders
      WHERE is_deposited = 0
    `);
    pendingStmt.step();
    const pendingDeposits = pendingStmt.getAsObject() as { pending: number };
    pendingStmt.free();

    // 오늘 매출
    const todayStmt = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as today
      FROM orders
      WHERE DATE(order_date) = DATE('now', 'localtime')
    `);
    todayStmt.step();
    const todaySales = todayStmt.getAsObject() as { today: number };
    todayStmt.free();

    // 이번 주 매출
    const weekStmt = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as week
      FROM orders
      WHERE DATE(order_date) >= DATE('now', 'localtime', 'weekday 0', '-6 days')
    `);
    weekStmt.step();
    const weekSales = weekStmt.getAsObject() as { week: number };
    weekStmt.free();

    // 이번 달 매출
    const monthStmt = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as month
      FROM orders
      WHERE DATE(order_date) >= DATE('now', 'localtime', 'start of month')
    `);
    monthStmt.step();
    const monthSales = monthStmt.getAsObject() as { month: number };
    monthStmt.free();

    // 결제 유형별 매출
    const paymentBreakdownStmt = db.prepare(`
      SELECT
        payment_type as type,
        COALESCE(SUM(total_amount), 0) as amount,
        COUNT(*) as count
      FROM orders
      GROUP BY payment_type
    `);

    const paymentBreakdown: { type: PaymentType; amount: number; count: number; }[] = [];
    while (paymentBreakdownStmt.step()) {
      const row = paymentBreakdownStmt.getAsObject();
      paymentBreakdown.push({
        type: row.type as PaymentType,
        amount: row.amount as number,
        count: row.count as number
      });
    }
    paymentBreakdownStmt.free();

    return {
      total_sales: totalSales.total,
      pending_deposits: pendingDeposits.pending,
      today_sales: todaySales.today,
      this_week_sales: weekSales.week,
      this_month_sales: monthSales.month,
      payment_type_breakdown: paymentBreakdown
    };
  }

  // 입금 스케줄 조회
  static getDepositSchedule(): DepositSchedule[] {
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT
        expected_deposit_date as date,
        id,
        payment_type,
        total_amount as amount,
        order_date
      FROM orders
      WHERE is_deposited = 0
        AND expected_deposit_date IS NOT NULL
      ORDER BY expected_deposit_date ASC, order_date ASC
    `);

    const scheduleMap = new Map<string, DepositSchedule>();

    while (stmt.step()) {
      const row = stmt.getAsObject();
      const date = row.date as string;

      if (!scheduleMap.has(date)) {
        scheduleMap.set(date, {
          date,
          total_amount: 0,
          orders: []
        });
      }

      const schedule = scheduleMap.get(date)!;
      schedule.total_amount += row.amount as number;
      schedule.orders.push({
        id: row.id as number,
        payment_type: row.payment_type as PaymentType,
        amount: row.amount as number,
        order_date: row.order_date as string
      });
    }
    stmt.free();

    return Array.from(scheduleMap.values());
  }

  // 입금 완료 처리
  static markAsDeposited(orderId: number, depositedDate?: string): void {
    const db = getDatabase();
    const depositDate = depositedDate || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      UPDATE orders
      SET is_deposited = 1, deposited_date = ?
      WHERE id = ?
    `);
    stmt.run([depositDate, orderId]);
    stmt.free();
  }

  // 특정 날짜의 입금 예정 주문들을 일괄 입금 완료 처리
  static markDateAsDeposited(expectedDate: string, depositedDate?: string): number {
    const db = getDatabase();
    const depositDate = depositedDate || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      UPDATE orders
      SET is_deposited = 1, deposited_date = ?
      WHERE expected_deposit_date = ? AND is_deposited = 0
    `);
    stmt.run([depositDate, expectedDate]);
    const changes = db.exec('SELECT changes() as count')[0].values[0][0] as number;
    stmt.free();

    return changes;
  }

  // 월별 매출 통계
  static getMonthlySales(year: number): { month: number; sales: number; orders: number; }[] {
    const db = getDatabase();

    const stmt = db.prepare(`
      SELECT
        CAST(strftime('%m', order_date) AS INTEGER) as month,
        COALESCE(SUM(total_amount), 0) as sales,
        COUNT(*) as orders
      FROM orders
      WHERE strftime('%Y', order_date) = ?
      GROUP BY strftime('%m', order_date)
      ORDER BY month
    `);

    const monthlySales: { month: number; sales: number; orders: number; }[] = [];
    stmt.bind([year.toString()]);

    while (stmt.step()) {
      const row = stmt.getAsObject();
      monthlySales.push({
        month: row.month as number,
        sales: row.sales as number,
        orders: row.orders as number
      });
    }
    stmt.free();

    return monthlySales;
  }

  // 결제 유형별 표시명
  static getPaymentTypeDisplayName(paymentType: PaymentType): string {
    switch (paymentType) {
      case 'CARD':
        return '💳 매장 카드결제';
      case 'COUPANG':
        return '🛒 쿠팡';
      case 'BAEMIN':
        return '🛵 배달의민족';
      case 'YOGIYO':
        return '🍽️ 요기요';
      default:
        return paymentType;
    }
  }

  // 결제 유형별 아이콘
  static getPaymentTypeIcon(paymentType: PaymentType): string {
    switch (paymentType) {
      case 'CARD':
        return '💳';
      case 'COUPANG':
        return '🛒';
      case 'BAEMIN':
        return '🛵';
      case 'YOGIYO':
        return '🍽️';
      default:
        return '💰';
    }
  }
}