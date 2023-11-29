export class User {
    private name!: string;
    private password!: string;
    private email!: string;
    
    constructor(name: string, password?: string, email?: string) {
        this.name = name;
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string) {
        this.name = name;
    }
}