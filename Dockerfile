FROM oven/bun:alpine AS builder

WORKDIR /app
COPY package.json bun.lock /app/

RUN bun i

COPY . /app/
RUN bun tailwindcss -i main.css -o twout.css && bun postcss twout.css -o assets/styles.css && rm twout.css
RUN bun build --outfile out.js --target bun index.tsx

FROM oven/bun:alpine

WORKDIR /app
COPY --from=builder /app/out.js /app/t.html /app/
COPY --from=builder /app/assets/ /app/assets/

EXPOSE 38483

ENTRYPOINT [ "bun", "out.js" ]
