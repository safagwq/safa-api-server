basepath=$(cd `dirname $0`; pwd)
Index="$basepath/index.js"
node "$Index" "$@"