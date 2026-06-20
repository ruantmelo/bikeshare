export type AuthUser = { id: string; email: string; role: string };
export type AuthResponse = { token: string; user: AuthUser };
