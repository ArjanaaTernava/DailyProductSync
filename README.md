## Description

**DailyProductSync** is a NestJS-based application that imports product data from a CSV file, processes it by transforming the data, storing it in MongoDB, and enhancing product descriptions using LangChain and OpenAI's GPT models. The project uses schedulers to run the import job on a daily basis.

## Project setup

```bash
$ npm install
```

### Environment variables
Environment variables are stored in a `.env` file. 

```bash
# .env
MONGODB_URI=mongodb://localhost:27017/daily-product-sync
OPENAI_API_KEY=your_openai_api_key
```

### MongoDB
To run the MongoDB service, use the following command:

```bash
$ docker-compose up -d
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

```
