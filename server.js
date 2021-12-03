const Koa = require('koa');
const koaBody = require('koa-body');
const http = require('http');
const uuid = require('uuid');
const app = new Koa();

app.use(async (ctx, next) => {
    const origin = ctx.request.get('Origin');
    if (!origin) {
        return await next();
    }
    const headers = { 'Access-Control-Allow-Origin': '*', };

    if (ctx.request.method !== 'OPTIONS') {
        ctx.response.set({ ...headers });
        try {
            return await next();
        } catch (e) {
            e.headers = { ...e.headers, ...headers };
            throw e;
        }
    }

    if (ctx.request.get('Access-Control-Request-Method')) {
        ctx.response.set({
            ...headers,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
        });

        if (ctx.request.get('Access-Control-Request-Headers')) {
            ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
        }
        ctx.response.status = 204;
    }
});



app.use(koaBody({
    urlencoded: true,
    text: true,
    json: true,
    multipart: true,
}));

let tickets = [];
class Ticket {
    constructor(id, name, description, status, created) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.status = status;
        this.created = created;
    }
}

app.use(async (ctx) => {
    if (ctx.request.method === 'GET') {
        const { method } = ctx.request.query;

        switch (method) {
            case 'allTickets': {
                ctx.response.body = tickets.map((item) => {
                    return {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        status: item.status,
                        created: item.created,
                    };
                });
                return;
            }
            case 'ticketById': {
                const { id } = ctx.request.query;
                if (id) {
                    const ticket = tickets.find(item => item.id == id);
                    ctx.response.body = ticket.description;
                    return;
                }
            }
            case 'status': {
                const { id, status } = ctx.request.query;
                const index = tickets.findIndex((item) => item.id === id);
                tickets[index].status = status;
                ctx.response.body = tickets[index].status;
                return;
            }
            case 'delete': {
                const { id } = ctx.request.query;
                tickets = tickets.filter((item) => item.id !== id);
                ctx.response.body = 'ok';
                return;
            }
            default: {
                ctx.response.status = 404;
                return;
            }
        }
    } else if (ctx.request.method === 'POST') {
        const { method } = ctx.request.query;
        const { name, description } = ctx.request.body;
        switch (method) {
            case 'create': {
                const itemDate = new Date();

                function formatDate(value) {
                    const returnValue = value < 10 ? `0${value}` : value;

                    return returnValue;
                }
                const date = formatDate(itemDate.getDate());
                const month = formatDate(itemDate.getMonth() + 1);
                const year = formatDate(itemDate.getFullYear());
                const hours = formatDate(itemDate.getHours());
                const min = formatDate(itemDate.getMinutes());
                const created = `${date}.${month}.${year} ${hours}:${min}`
                const id = uuid.v4();
                const ticket = new Ticket(id, name, description, null, created);
                tickets.push(ticket);
                ctx.response.body = ticket;
                return;
            }
            case 'edit': {
                const { id, name, description } = ctx.request.body;
                const index = tickets.findIndex((item) => item.id === id);
                tickets[index].name = name;
                tickets[index].description = description;
                ctx.response.body = tickets[index];
                return;
            }
        }
    }
});

const port = process.env.PORT || 7000;
const server = http.createServer(app.callback()).listen(port);
