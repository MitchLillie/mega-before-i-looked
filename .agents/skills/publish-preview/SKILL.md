---
name: publish-preview
description: Put one rig page up as a public HTML preview on surge.sh, upload over it, and take it down (ADR 0003). Use for a plan's "Preview for review" and "Clean up" sections.
---

# publish-preview

A preview is one self-contained HTML file on a public HTTPS link we can upload over (ADR 0003).
This routine uses surge.sh through `npx surge` (no global install). Needs a surge account the
human signed in to (`npx surge login`, then `npx surge whoami`). The human approves every upload.

## Save the page (a command, not a browser)

```sh
PORT=8790 pnpm start &                      # LANE_MARKER from .env, or unset it for the clean copy
mkdir -p ../preview                         # outside the repo: no previews in git (ADR 0003)
curl -sf localhost:8790/digest/<night> -o ../preview/index.html
grep -o 'class="marker">[^<]*' ../preview/index.html   # check the banner before upload
```

## Put it up / upload over it

```sh
npx surge ../preview <name>.surge.sh
curl -s https://<name>.surge.sh/ | grep -o 'class="marker">[^<]*'
```

surge also serves every upload at its own revision link, `<rev>--<name>.surge.sh`, which the
publish output prints as "Live preview". Uploading over the production link does NOT remove the
older revision links.

## Take the marker off (clean up)

Uploading over leaves the marked revision reachable at its revision link. So: tear down, then
publish the clean copy to the same name, then check both links.

```sh
npx surge teardown <name>.surge.sh          # removes the site and every revision link
LANE_MARKER= PORT=8790 pnpm start &          # banner reads "no marker set"
curl -sf localhost:8790/digest/<night> -o ../preview/index.html
npx surge ../preview <name>.surge.sh
curl -s https://<name>.surge.sh/ | grep -o 'class="marker">[^<]*'        # no marker set
curl -s -o /dev/null -w '%{http_code}\n' https://<old-rev>--<name>.surge.sh/   # 404
```

## Take it down

```sh
npx surge teardown <name>.surge.sh
```

Surge asks the account to verify its email, or the site may stop being served.
