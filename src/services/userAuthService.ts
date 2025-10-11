export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee';
}

export class UserAuthService {
  private static readonly USER_SESSION_KEY = 'user_auth_session';
  private static readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8시간

  // 임시 사용자 데이터베이스 (실제 운영에서는 서버에서 관리)
  private static readonly USERS: Array<User & { password: string }> = [
    { id: '1', name: '김직원', email: 'employee1@store.com', password: '1234', role: 'employee' },
    { id: '2', name: '이근무', email: 'employee2@store.com', password: '1234', role: 'employee' },
    { id: '3', name: '박알바', email: 'employee3@store.com', password: '1234', role: 'employee' },
    { id: '4', name: '최사원', email: 'employee4@store.com', password: '1234', role: 'employee' },
  ];

  /**
   * 일반 사용자 로그인
   */
  static login(email: string, password: string): { success: boolean; user?: User; error?: string } {
    const user = this.USERS.find(u => u.email === email && u.password === password);

    if (!user) {
      return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    }

    const token = this.generateToken(user.id);
    const sessionData = {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      loginTime: Date.now(),
      expiryTime: Date.now() + this.SESSION_DURATION
    };

    localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(sessionData));
    return { success: true, user: sessionData.user };
  }

  /**
   * 로그아웃
   */
  static logout(): void {
    localStorage.removeItem(this.USER_SESSION_KEY);
  }

  /**
   * 현재 로그인 상태 확인
   */
  static isAuthenticated(): boolean {
    const sessionData = this.getSessionData();
    if (!sessionData) return false;

    // 세션 만료 확인
    if (Date.now() > sessionData.expiryTime) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * 현재 사용자 정보 반환
   */
  static getCurrentUser(): (User & { loginTime: number }) | null {
    const sessionData = this.getSessionData();
    if (!sessionData || !this.isAuthenticated()) return null;

    return {
      ...sessionData.user,
      loginTime: sessionData.loginTime
    };
  }

  /**
   * 세션 연장
   */
  static extendSession(): void {
    const sessionData = this.getSessionData();
    if (sessionData && this.isAuthenticated()) {
      sessionData.expiryTime = Date.now() + this.SESSION_DURATION;
      localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(sessionData));
    }
  }

  /**
   * 세션 만료까지 남은 시간 (밀리초)
   */
  static getTimeUntilExpiry(): number {
    const sessionData = this.getSessionData();
    if (!sessionData) return 0;

    return Math.max(0, sessionData.expiryTime - Date.now());
  }

  /**
   * 모든 사용자 목록 반환 (관리자용)
   */
  static getAllUsers(): User[] {
    return this.USERS.map(({ password, ...user }) => user);
  }

  /**
   * 토큰 생성
   */
  private static generateToken(userId: string): string {
    return btoa(`${userId}:${Date.now()}:${Math.random()}`);
  }

  /**
   * 세션 데이터 가져오기
   */
  private static getSessionData(): {
    token: string;
    user: User;
    loginTime: number;
    expiryTime: number;
  } | null {
    try {
      const data = localStorage.getItem(this.USER_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}