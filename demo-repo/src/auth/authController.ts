import { AuthService } from './authService';

export interface Request {
    body: {
        token?: string;
        [key: string]: unknown;
    };
}

export interface Response {
    status: (code: number) => Response;
    send: (body: unknown) => void;
}

export function login(req: Request, res: Response): void {
    const service = new AuthService();
    const token = req.body.token || "";
    if (service.authenticate(token)) {
        res.status(200).send("Success");
    } else {
        res.status(401).send("Unauthorized");
    }
}
