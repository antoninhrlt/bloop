#!/bin/sh -e


QDRANT_VERSION=v1.0.1
ROOTDIR=src-tauri
BINDIR=src-tauri/bin
QDRANT_RELEASE=qdrant

TARGET_TRIPLET="$(rustc -Vv |grep host |cut -d\  -f2)"
QDRANT_LINK=qdrant-$TARGET_TRIPLET

COMMAND=$1 
case "$COMMAND" in
	build|dev) ;;
	*) 
		echo "build.sh <build|dev>"
	       	exit 1
esac


cargo install --git https://github.com/qdrant/qdrant --tag $QDRANT_VERSION --locked --root $ROOTDIR qdrant || true
(cd $BINDIR; test -f $QDRANT_LINK || ln -sf $QDRANT_RELEASE $QDRANT_LINK)

pnpm build $COMMAND
