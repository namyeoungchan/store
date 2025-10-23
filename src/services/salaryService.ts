import { UserService } from './userService';
import { User, UserWithSchedule } from '../types';

export interface WeeklySalaryCalculation {
  userId: string;
  userName: string;
  position: string;
  salaryType: 'HOURLY' | 'MONTHLY';
  weeklyHours: number;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  weeklyHolidayPay: number; // 주휴수당
  totalWeeklyPay: number;
}

export interface SalaryDashboardData {
  totalEmployees: number;
  totalWeeklyPayroll: number;
  totalHolidayPay: number;
  employeeSalaries: WeeklySalaryCalculation[];
}

export class SalaryService {
  // 한국 근로기준법에 따른 주휴수당 계산
  static calculateWeeklyHolidayPay(weeklyHours: number, hourlyWage: number): number {
    // 주 15시간 이상 근무 시 주휴수당 지급 (8시간 기준)
    if (weeklyHours >= 15) {
      return hourlyWage * 8;
    }
    // 주 15시간 미만 근무 시 비례 계산
    else if (weeklyHours > 0) {
      return (weeklyHours / 40) * hourlyWage * 8;
    }
    return 0;
  }

  // 주당 임금 계산 (시급제)
  static calculateHourlySalary(
    weeklyHours: number,
    hourlyWage: number
  ): {
    regularPay: number;
    overtimePay: number;
    weeklyHolidayPay: number;
    totalPay: number;
  } {
    const regularHours = Math.min(weeklyHours, 40);
    const overtimeHours = Math.max(weeklyHours - 40, 0);

    const regularPay = regularHours * hourlyWage;
    const overtimePay = overtimeHours * hourlyWage * 1.5; // 연장근로수당 50% 추가
    const weeklyHolidayPay = this.calculateWeeklyHolidayPay(weeklyHours, hourlyWage);

    return {
      regularPay,
      overtimePay,
      weeklyHolidayPay,
      totalPay: regularPay + overtimePay + weeklyHolidayPay
    };
  }

  // 주당 임금 계산 (월급제)
  static calculateMonthlySalary(
    monthlySalary: number,
    weeklyHours: number = 40
  ): {
    regularPay: number;
    overtimePay: number;
    weeklyHolidayPay: number;
    totalPay: number;
  } {
    // 월급을 주급으로 환산 (한 달 = 4.33주)
    const weeklyBasePay = monthlySalary / 4.33;

    // 월급제도 40시간 초과 시 연장근로수당 계산
    const overtimeHours = Math.max(weeklyHours - 40, 0);
    const hourlyRate = monthlySalary / (40 * 4.33); // 시간당 환산
    const overtimePay = overtimeHours * hourlyRate * 1.5;

    // 월급제는 기본적으로 주휴수당이 포함되어 있다고 가정
    const weeklyHolidayPay = 0;

    return {
      regularPay: weeklyBasePay,
      overtimePay,
      weeklyHolidayPay,
      totalPay: weeklyBasePay + overtimePay
    };
  }

  // 개별 직원의 주간 임금 계산
  static async calculateUserWeeklySalary(user: UserWithSchedule): Promise<WeeklySalaryCalculation> {
    const weeklyHours = user.total_hours_this_week || 0;
    let salaryInfo;

    if (user.salary_type === 'HOURLY') {
      salaryInfo = this.calculateHourlySalary(weeklyHours, user.hourly_wage || 0);
    } else {
      salaryInfo = this.calculateMonthlySalary(user.monthly_salary || 0, weeklyHours);
    }

    const regularHours = Math.min(weeklyHours, 40);
    const overtimeHours = Math.max(weeklyHours - 40, 0);

    return {
      userId: user.id!,
      userName: user.full_name,
      position: user.position,
      salaryType: user.salary_type,
      weeklyHours,
      regularHours,
      overtimeHours,
      regularPay: salaryInfo.regularPay,
      overtimePay: salaryInfo.overtimePay,
      weeklyHolidayPay: salaryInfo.weeklyHolidayPay,
      totalWeeklyPay: salaryInfo.totalPay
    };
  }

  // 전체 직원 임금 대시보드 데이터 조회
  static async getSalaryDashboardData(): Promise<SalaryDashboardData> {
    try {
      const users = await UserService.getUsersWithCurrentSchedule();
      const employeeSalaries: WeeklySalaryCalculation[] = [];

      let totalWeeklyPayroll = 0;
      let totalHolidayPay = 0;

      for (const user of users) {
        const salary = await this.calculateUserWeeklySalary(user);
        employeeSalaries.push(salary);

        totalWeeklyPayroll += salary.totalWeeklyPay;
        totalHolidayPay += salary.weeklyHolidayPay;
      }

      return {
        totalEmployees: users.length,
        totalWeeklyPayroll,
        totalHolidayPay,
        employeeSalaries
      };
    } catch (error) {
      console.error('Error getting salary dashboard data:', error);
      return {
        totalEmployees: 0,
        totalWeeklyPayroll: 0,
        totalHolidayPay: 0,
        employeeSalaries: []
      };
    }
  }

  // 월별 예상 급여 계산
  static calculateMonthlyProjection(weeklyPayroll: number): number {
    return weeklyPayroll * 4.33; // 한 달 = 4.33주
  }

  // 급여 지급일 계산 (매월 25일)
  static getNextPayday(): string {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let payDay = new Date(currentYear, currentMonth, 25);

    // 이번 달 25일이 지났으면 다음 달 25일
    if (today.getDate() > 25) {
      payDay = new Date(currentYear, currentMonth + 1, 25);
    }

    return payDay.toISOString().split('T')[0];
  }

  // 급여 지급까지 남은 일수
  static getDaysUntilPayday(): number {
    const today = new Date();
    const payDay = new Date(this.getNextPayday());
    const diffTime = payDay.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}