#!/bin/bash
# Downloads every icon referenced in config/*.yaml into public/icons/, so the
# dashboard makes no CDN round-trips at page load. Safe to re-run; existing
# files are left alone. Run it after adding an icon to a service or bookmark:
#   ./config/fetch-icons.sh
set -u
cd "$(dirname "$0")/.." || exit 1

mdi=public/icons/mdi
si=public/icons/si
dash=public/icons/dashboard
selfhst=public/icons/selfhst
mkdir -p "$mdi" "$si" "$dash"

fetch() { # url dest
  [ -f "$2" ] && return 0
  if curl -fsS --max-time 20 -o "$2" "$1"; then
    echo "fetched  $2"
  else
    rm -f "$2"
    echo "MISSING  $1  (check the icon name)" >&2
  fi
}

grep -rhoE 'icon: [^ ]+' config/*.yaml | sed 's/icon: //' | sort -u | while read -r icon; do
  name=${icon%-#*} # strip a -#rrggbb color suffix
  case "$name" in
    mdi-*) fetch "https://cdn.jsdelivr.net/npm/@mdi/svg@latest/svg/${name#mdi-}.svg" "$mdi/${name#mdi-}.svg" ;;
    si-*) fetch "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${name#si-}.svg" "$si/${name#si-}.svg" ;;
    fas-* | far-* | fab-*) ;; # Font Awesome, already local via the public/icons/fa symlink
    sh-*)
      bare=${name#sh-}
      case "$bare" in
        *.svg | *.webp) ext=${bare##*.} base=${bare%.*} ;;
        *.png) ext=png base=${bare%.*} ;;
        *) ext=png base=$bare ;;
      esac
      mkdir -p "$selfhst/$ext"
      fetch "https://cdn.jsdelivr.net/gh/selfhst/icons@main/$ext/$base.$ext" "$selfhst/$ext/$base.$ext"
      ;;
    /* | http*) ;;            # explicit local path or full URL, nothing to do
    *)
      case "$name" in
        *.svg | *.webp | *.png) ext=${name##*.} base=${name%.*} ;;
        *) ext=png base=$name ;;
      esac
      mkdir -p "$dash/$ext"
      fetch "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/$ext/$base.$ext" "$dash/$ext/$base.$ext"
      ;;
  esac
done
