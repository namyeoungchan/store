import { UserService } from './userService';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee';
}

export class UserAuthService {
  private static readonly USER_SESSION_KEY = 'user_auth_session';
  private static readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8시간

  /**
   * 일반 사용자 로그인
   */
  static async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const dbUser = await UserService.authenticateUser(email, password);

      if (!dbUser) {
        return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
      }

      if (!dbUser.is_active) {
        return { success: false, error: '비활성화된 계정입니다. 관리자에게 문의하세요.' };
      }

      const user: User = {
        id: dbUser.id!.toString(),
        name: dbUser.full_name,
        email: dbUser.email,
        role: 'employee'
      };

      const token = this.generateToken(user.id);
      const sessionData = {
        token,
        user,
        loginTime: Date.now(),
        expiryTime: Date.now() + this.SESSION_DURATION
      };

      localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(sessionData));
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '로그인 중 오류가 발생했습니다.' };
    }
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
   * 로그인 가능한 사용자 목록 조회 (개발/테스트용)
   */
  static async getLoginEnabledUsers(): Promise<Array<{ email: string; name: string; hasTemp: boolean }>> {
    try {
      const allUsers = await UserService.getAllUsers();
      return allUsers
        .filter(user => user.password_hash && user.is_active)
        .map(user => ({
          email: user.email,
          name: user.full_name,
          hasTemp: !!user.is_password_temp
        }));
    } catch (error) {
      console.error('Error getting login enabled users:', error);
      return [];
    }
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