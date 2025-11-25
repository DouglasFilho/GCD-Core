import { Injectable } from "@nestjs/common";
import { ChamberClient } from "./chamber.client";

@Injectable()
export class ChamberService {
    constructor(private readonly client: ChamberClient) { }

    async getDeputies() {
        const deputiesResponse = await this.client.get('/deputados');
        return deputiesResponse;
    }

    async getDeputy(id: number) {
        return this.client.get(`/deputados/${id}`);
    }

    async getDeputyExpenses(id: number, params?: Record<string, any>) {
        return this.client.get(`/deputados/${id}/despesas`, { itens: 100, ...params });
    }
}
