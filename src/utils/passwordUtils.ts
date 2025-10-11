// 클라이언트 사이드에서 간단한 해싱 (실제 운영에서는 서버에서 처리해야 함)
export class PasswordUtils {

  // 간단한 해시 함수 (실제로는 bcrypt 등을 서버에서 사용해야 함)
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_for_store_system');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 비밀번호 검증
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedInput = await this.hashPassword(password);
    return hashedInput === hash;
  }

  // 임시 비밀번호 생성
  static generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 비밀번호 강도 검사
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 4) {
      errors.push('비밀번호는 최소 4자리 이상이어야 합니다.');
    }

    if (password.length > 20) {
      errors.push('비밀번호는 20자리를 초과할 수 없습니다.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}