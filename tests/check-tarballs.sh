#!/bin/bash
set -e

echo "🔍 Checking tarballs for invalid '../' paths..."

found_invalid=0

for tarball in "$@"; do
    echo "📦 Checking $tarball..."
    if tar -tzf "$tarball" | grep '\.\.' > /dev/null; then
        echo "❌ ERROR: $tarball contains entries with '..' in their paths!"
        tar -tzf "$tarball" | grep '\.\.'
        found_invalid=1
    fi

    echo "🧪 Dry run publish for $tarball..."
    if ! npm publish "$tarball" --dry-run > /dev/null 2>&1; then
        echo "❌ ERROR: npm dry run failed for $tarball"
        found_invalid=1
        continue
    fi

    echo "✅ OK: $tarball"
done

if [ "$found_invalid" -ne 0 ]; then
    echo "🚫 One or more tarballs contain unsafe paths. Aborting."
    exit 1
fi

echo "🎉 All tarballs passed the check."
