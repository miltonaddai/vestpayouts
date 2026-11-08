# API image. Build from the repository root:
#   docker build -t vestpayouts-api .
# The Next.js app deploys to Netlify (see netlify.toml) and is not part of this image.
FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json yarn.lock ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN yarn install --frozen-lockfile
COPY packages/shared packages/shared
COPY apps/api apps/api
ENV NODE_ENV=production
ENV PORT=4318
EXPOSE 4318
CMD ["yarn", "workspace", "@vestpayouts/api", "start"]
