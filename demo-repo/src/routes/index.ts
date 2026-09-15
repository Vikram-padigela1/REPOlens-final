import { login, Request, Response } from '../auth/authController';
import { registerUser, UserRequest, UserResponse } from '../users/userController';

export interface ExpressApp {
    post: <Req = unknown, Res = unknown>(path: string, handler: (req: Req, res: Res) => void) => void;
}

export function setupRoutes(app: ExpressApp): void {
    app.post('/api/login', (req: Request, res: Response) => login(req, res));
    app.post('/api/register', (req: UserRequest, res: UserResponse) => registerUser(req, res));
}
