export interface WorkTime {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD 형식
  startTime: string; // HH:MM 형식
  endTime: string; // HH:MM 형식
  breakTime: number; // 분 단위
  totalHours: number; // 실제 근무시간 (시간 단위)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkSummary {
  totalDays: number;
  totalHours: number;
  averageHours: number;
  thisWeekHours: number;
  thisMonthHours: number;
}

export class WorkTimeService {
  private static readonly STORAGE_KEY = 'work_time_records';

  /**
   * 근무시간 등록
   */
  static addWorkTime(
    userId: string,
    date: string,
    startTime: string,
    endTime: string,
    breakTime: number,
    notes?: string
  ): WorkTime {
    const records = this.getAllRecords();

    // 같은 날짜의 기존 기록이 있는지 확인
    const existingIndex = records.findIndex(
      record => record.userId === userId && record.date === date
    );

    const totalHours = this.calculateWorkHours(startTime, endTime, breakTime);

    const workTime: WorkTime = {
      id: existingIndex >= 0 ? records[existingIndex].id : this.generateId(),
      userId,
      date,
      startTime,
      endTime,
      breakTime,
      totalHours,
      notes,
      createdAt: existingIndex >= 0 ? records[existingIndex].createdAt : new Date(),
      updatedAt: new Date()
    };

    if (existingIndex >= 0) {
      // 기존 기록 업데이트
      records[existingIndex] = workTime;
    } else {
      // 새 기록 추가
      records.push(workTime);
    }

    this.saveRecords(records);
    return workTime;
  }

  /**
   * 사용자의 근무시간 기록 조회
   */
  static getUserWorkTimes(userId: string, limit?: number): WorkTime[] {
    const records = this.getAllRecords()
      .filter(record => record.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return limit ? records.slice(0, limit) : records;
  }

  /**
   * 특정 날짜의 근무시간 조회
   */
  static getWorkTimeByDate(userId: string, date: string): WorkTime | null {
    const records = this.getAllRecords();
    return records.find(record => record.userId === userId && record.date === date) || null;
  }

  /**
   * 근무시간 통계 조회
   */
  static getWorkSummary(userId: string): WorkSummary {
    const records = this.getUserWorkTimes(userId);
    const now = new Date();

    // 이번 주 시작일 (일요일)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // 이번 달 시작일
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalHours = records.reduce((sum, record) => sum + record.totalHours, 0);
    const thisWeekHours = records
      .filter(record => new Date(record.date) >= startOfWeek)
      .reduce((sum, record) => sum + record.totalHours, 0);

    const thisMonthHours = records
      .filter(record => new Date(record.date) >= startOfMonth)
      .reduce((sum, record) => sum + record.totalHours, 0);

    return {
      totalDays: records.length,
      totalHours,
      averageHours: records.length > 0 ? totalHours / records.length : 0,
      thisWeekHours,
      thisMonthHours
    };
  }

  /**
   * 최근 7일간의 근무시간 데이터 (차트용)
   */
  static getWeeklyData(userId: string): Array<{ date: string; hours: number; dayName: string }> {
    const records = this.getUserWorkTimes(userId);
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const record = records.find(r => r.date === dateString);
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

      result.push({
        date: dateString,
        hours: record ? record.totalHours : 0,
        dayName: dayNames[date.getDay()]
      });
    }

    return result;
  }

  /**
   * 근무시간 삭제
   */
  static deleteWorkTime(userId: string, workTimeId: string): boolean {
    const records = this.getAllRecords();
    const index = records.findIndex(
      record => record.id === workTimeId && record.userId === userId
    );

    if (index >= 0) {
      records.splice(index, 1);
      this.saveRecords(records);
      return true;
    }

    return false;
  }

  /**
   * 근무시간 계산 (시간 단위)
   */
  private static calculateWorkHours(startTime: string, endTime: string, breakTime: number): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // 다음날 근무인 경우 (예: 22:00 ~ 06:00)
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const totalMinutes = endMinutes - startMinutes - breakTime;
    return Math.max(0, totalMinutes / 60); // 시간 단위로 변환
  }

  /**
   * 모든 기록 조회
   */
  private static getAllRecords(): WorkTime[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * 기록 저장
   */
  private static saveRecords(records: WorkTime[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
  }

  /**
   * ID 생성
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}