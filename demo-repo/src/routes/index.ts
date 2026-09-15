import { login, Request, Response } from '../auth/authController';
import { registerUser, UserRequest, UserResponse } from '../users/userController';

export interface ExpressApp {
    post: (path: string, handler: (req: any, res: any) => void) => void;
}

export function setupRoutes(app: ExpressApp): void {
    app.post('/api/login', (req: Request, res: Response) => login(req, res));
    app.post('/api/register', (req: UserRequest, res: UserResponse) => registerUser(req, res));
}
