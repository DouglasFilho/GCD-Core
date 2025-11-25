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
        return this.getAllPages(`/deputados/${id}/despesas`, { itens: 100, pagina: 1, ...params });
    }

    private async getAllPages<T>(path: string, params?: Record<string, any>) {
        const firstPage = await this.client.get<any>(path, params);
        const allData = [...this.extractItems<T>(firstPage)];
        const normalizedLinks = this.normalizeLinks(firstPage?.links);

        let nextPage = this.extractNextPage(normalizedLinks);

        while (nextPage) {
            const pageResponse = await this.client.get<any>(path, { ...params, pagina: nextPage });

            allData.push(...this.extractItems<T>(pageResponse));

            const candidateNext = this.extractNextPage(this.normalizeLinks(pageResponse?.links));

            if (!candidateNext || candidateNext <= nextPage) {
                break;
            }

            nextPage = candidateNext;
        }

        return { dados: allData, links: normalizedLinks };
    }

    private extractItems<T>(data: any): T[] {
        if (!data) return [];

        if (Array.isArray(data.dados)) {
            return data.dados;
        }

        if (data.dados?.registroCotas) {
            const registros = data.dados.registroCotas;
            return Array.isArray(registros) ? registros : [registros];
        }

        return [];
    }

    private normalizeLinks(links: any): Array<{ rel: string; href: string }> {
        if (!links) return [];

        if (Array.isArray(links)) {
            return links.filter((link) => link?.rel && link?.href);
        }

        if (links.link) {
            const linkArray = Array.isArray(links.link) ? links.link : [links.link];
            return linkArray.filter((l) => l?.rel && l?.href).map((l) => ({ rel: l.rel, href: l.href }));
        }

        return [];
    }

    private extractNextPage(links?: Array<{ rel: string; href: string }>) {
        const nextLink = links?.find((link) => link.rel === "next");

        if (!nextLink?.href) {
            return null;
        }

        const nextPageParam = new URL(nextLink.href).searchParams.get("pagina");

        return nextPageParam ? Number(nextPageParam) : null;
    }
}
