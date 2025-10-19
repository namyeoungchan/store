import { FirestoreService } from '../database/database';
import { PaymentType, SalesAnalytics, DepositSchedule } from '../types';

export class SalesService {
  private static collectionName = FirestoreService.collections.orders;

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
  static async getSalesAnalytics(): Promise<SalesAnalytics> {
    try {
      const allOrders = await FirestoreService.getAll(this.collectionName);

      // 전체 매출
      const totalSales = allOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      // 입금 대기 금액
      const pendingDeposits = allOrders
        .filter(order => !order.is_deposited)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      // 날짜 계산
      const today = new Date().toISOString().split('T')[0];
      const thisWeekStart = this.getWeekStart(new Date());
      const thisMonthStart = new Date().toISOString().slice(0, 7) + '-01';

      // 오늘 매출
      const todaySales = allOrders
        .filter(order => order.order_date?.startsWith(today))
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      // 이번 주 매출
      const weekSales = allOrders
        .filter(order => {
          const orderDate = order.order_date?.split('T')[0];
          return orderDate >= thisWeekStart;
        })
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      // 이번 달 매출
      const monthSales = allOrders
        .filter(order => order.order_date?.startsWith(thisMonthStart.slice(0, 7)))
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      // 결제 유형별 매출
      const paymentBreakdown: { type: PaymentType; amount: number; count: number; }[] = [];
      const paymentGroups = new Map<PaymentType, { amount: number; count: number }>();

      allOrders.forEach(order => {
        const type = order.payment_type as PaymentType || 'CARD';
        if (!paymentGroups.has(type)) {
          paymentGroups.set(type, { amount: 0, count: 0 });
        }
        const group = paymentGroups.get(type)!;
        group.amount += order.total_amount || 0;
        group.count += 1;
      });

      paymentGroups.forEach((value, key) => {
        paymentBreakdown.push({
          type: key,
          amount: value.amount,
          count: value.count
        });
      });

      return {
        total_sales: totalSales,
        pending_deposits: pendingDeposits,
        today_sales: todaySales,
        this_week_sales: weekSales,
        this_month_sales: monthSales,
        payment_type_breakdown: paymentBreakdown
      };
    } catch (error) {
      console.error('Error getting sales analytics:', error);
      return {
        total_sales: 0,
        pending_deposits: 0,
        today_sales: 0,
        this_week_sales: 0,
        this_month_sales: 0,
        payment_type_breakdown: []
      };
    }
  }

  // 입금 스케줄 조회
  static async getDepositSchedule(): Promise<DepositSchedule[]> {
    try {
      const pendingOrders = await FirestoreService.getWithMultipleWhere(this.collectionName, [
        { field: 'is_deposited', operator: '==', value: false }
      ]);

      const scheduleMap = new Map<string, DepositSchedule>();

      pendingOrders.forEach(order => {
        if (!order.expected_deposit_date) return;

        const date = order.expected_deposit_date;

        if (!scheduleMap.has(date)) {
          scheduleMap.set(date, {
            date,
            total_amount: 0,
            orders: []
          });
        }

        const schedule = scheduleMap.get(date)!;
        schedule.total_amount += order.total_amount || 0;
        schedule.orders.push({
          id: order.id,
          payment_type: order.payment_type as PaymentType,
          amount: order.total_amount || 0,
          order_date: order.order_date
        });
      });

      // 날짜순 정렬
      return Array.from(scheduleMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error getting deposit schedule:', error);
      return [];
    }
  }

  // 입금 완료 처리
  static async markAsDeposited(orderId: string, depositedDate?: string): Promise<void> {
    try {
      const depositDate = depositedDate || new Date().toISOString().split('T')[0];
      await FirestoreService.update(this.collectionName, orderId, {
        is_deposited: true,
        deposited_date: depositDate
      });
    } catch (error) {
      console.error('Error marking as deposited:', error);
      throw error;
    }
  }

  // 특정 날짜의 입금 예정 주문들을 일괄 입금 완료 처리
  static async markDateAsDeposited(expectedDate: string, depositedDate?: string): Promise<number> {
    try {
      const depositDate = depositedDate || new Date().toISOString().split('T')[0];
      const ordersToUpdate = await FirestoreService.getWithMultipleWhere(this.collectionName, [
        { field: 'expected_deposit_date', operator: '==', value: expectedDate },
        { field: 'is_deposited', operator: '==', value: false }
      ]);

      let updateCount = 0;
      for (const order of ordersToUpdate) {
        await FirestoreService.update(this.collectionName, order.id, {
          is_deposited: true,
          deposited_date: depositDate
        });
        updateCount++;
      }

      return updateCount;
    } catch (error) {
      console.error('Error marking date as deposited:', error);
      return 0;
    }
  }

  // 월별 매출 통계
  static async getMonthlySales(year: number): Promise<{ month: number; sales: number; orders: number; }[]> {
    try {
      const allOrders = await FirestoreService.getAll(this.collectionName);

      const monthlyStats = new Map<number, { sales: number; orders: number }>();

      // 초기화 (1-12월)
      for (let i = 1; i <= 12; i++) {
        monthlyStats.set(i, { sales: 0, orders: 0 });
      }

      allOrders.forEach(order => {
        if (!order.order_date) return;

        const orderDate = new Date(order.order_date);
        if (orderDate.getFullYear() === year) {
          const month = orderDate.getMonth() + 1; // 0-based to 1-based
          const stats = monthlyStats.get(month)!;
          stats.sales += order.total_amount || 0;
          stats.orders += 1;
        }
      });

      const result: { month: number; sales: number; orders: number; }[] = [];
      monthlyStats.forEach((value, key) => {
        result.push({
          month: key,
          sales: value.sales,
          orders: value.orders
        });
      });

      return result.sort((a, b) => a.month - b.month);
    } catch (error) {
      console.error('Error getting monthly sales:', error);
      return [];
    }
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

  // 주의 시작일 계산 (월요일)
  private static getWeekStart(date: Date): string {
    const today = new Date(date);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  }
}