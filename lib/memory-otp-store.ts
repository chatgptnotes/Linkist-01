// Memory-based OTP storage for development when Supabase is not available
interface OTPRecord {
  otp: string;
  expiresAt: number;
  type: 'email' | 'phone';
  userData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

class MemoryOTPStore {
  private store: Map<string, OTPRecord> = new Map();

  set(identifier: string, record: OTPRecord): void {
    this.store.set(identifier, record);
    console.log(`📱 [Memory OTP] Stored OTP for ${identifier}: ${record.otp}`);
    this.cleanExpired();
  }

  get(identifier: string): OTPRecord | null {
    const record = this.store.get(identifier);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      this.store.delete(identifier);
      return null;
    }

    return record;
  }

  delete(identifier: string): void {
    this.store.delete(identifier);
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  getAllForDev(): Array<{ identifier: string; otp: string; expiresAt: number; type: string }> {
    this.cleanExpired();
    return Array.from(this.store.entries()).map(([identifier, record]) => ({
      identifier,
      otp: record.otp,
      expiresAt: record.expiresAt,
      type: record.type
    }));
  }

  clear(): void {
    this.store.clear();
  }
}

export const memoryOTPStore = new MemoryOTPStore();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}