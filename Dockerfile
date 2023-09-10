FROM oven/bun:latest

WORKDIR /app

COPY *.json ./
COPY bun.lockb ./
COPY *.tsx ./
COPY *.ts ./
COPY *.js ./
COPY *.css ./
COPY dynamicBuild/* ./dynamicBuild/
COPY components/* ./components/
COPY dist/* ./dist/
COPY lib/* ./lib/

RUN bun install

EXPOSE 3000

CMD [ "bun", "start" ]