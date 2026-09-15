export class AuthService {
    public authenticate(token: string): boolean {
        // verify token logic
        return token === "valid_token";
    }
}
