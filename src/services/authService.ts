export class AuthService {
  private static readonly ADMIN_USERNAME = 'admin';
  private static readonly ADMIN_PASSWORD = '939495';
  private static readonly AUTH_TOKEN_KEY = 'admin_auth_token';
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24시간

  /**
   * 관리자 로그인
   */
  static login(username: string, password: string): boolean {
    if (username === this.ADMIN_USERNAME && password === this.ADMIN_PASSWORD) {
      const token = this.generateToken();
      const sessionData = {
        token,
        username,
        loginTime: Date.now(),
        expiryTime: Date.now() + this.SESSION_DURATION
      };

      localStorage.setItem(this.AUTH_TOKEN_KEY, JSON.stringify(sessionData));
      return true;
    }
    return false;
  }

  /**
   * 로그아웃
   */
  static logout(): void {
    localStorage.removeItem(this.AUTH_TOKEN_KEY);
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
  static getCurrentUser(): { username: string; loginTime: number } | null {
    const sessionData = this.getSessionData();
    if (!sessionData || !this.isAuthenticated()) return null;

    return {
      username: sessionData.username,
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
      localStorage.setItem(this.AUTH_TOKEN_KEY, JSON.stringify(sessionData));
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
   * 토큰 생성
   */
  private static generateToken(): string {
    return btoa(`${this.ADMIN_USERNAME}:${Date.now()}:${Math.random()}`);
  }

  /**
   * 세션 데이터 가져오기
   */
  private static getSessionData(): {
    token: string;
    username: string;
    loginTime: number;
    expiryTime: number;
  } | null {
    try {
      const data = localStorage.getItem(this.AUTH_TOKEN_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}