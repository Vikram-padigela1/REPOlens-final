export interface UserRequest {
    body: {
        username?: string;
        [key: string]: unknown;
    };
}

export interface UserResponse {
    status: (code: number) => UserResponse;
    send: (body: unknown) => void;
}

export function registerUser(req: UserRequest, res: UserResponse): void {
    console.log("User registered: ", req.body.username);
    res.status(201).send("User created");
}
