import { User } from "./user";

export class UserFeatures {
    public level!: any;
    public deplacement!: any;
    public achats!: any;
    public maison!: any;
    public internet!: any;
    
    constructor(level?: string, deplacement?: number, achats?: number, maison?: number, internet?: number) {
        this.level = level;
        this.deplacement = deplacement;
        this.achats = achats;
        this.maison = maison;
        this.internet = internet;
    }
}