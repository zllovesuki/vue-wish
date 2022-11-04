build:
	npm run build

guard-%:
	@ if [ -z '${${*}}' ]; then echo 'Environment variable $* not set' && exit 1; fi

publish: guard-CLOUDFLARE_ACCOUNT_ID
	npx wrangler pages publish dist/