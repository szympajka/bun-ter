FROM oven/bun:latest

WORKDIR /app

COPY *.json ./
COPY bun.lockb ./
COPY *.tsx ./
COPY *.ts ./
COPY dynamicBuild/*.ts ./dynamicBuild/
COPY dynamicBuild/*.tsx ./dynamicBuild/

RUN bun install

EXPOSE 3000

CMD [ "bun", "start" ]