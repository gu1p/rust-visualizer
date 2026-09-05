#!/bin/sh
# Install the latest verified Linux/macOS release without elevated privileges.
set -eu

fail() {
  printf 'rust-visualizer installer: %s\n' "$*" >&2
  exit 1
}

download() {
  curl --proto '=https' --proto-redir '=https' --tlsv1.2 -fsSL \
    --connect-timeout 15 --max-time 120 --retry 3 "$@"
}

cleanup() {
  if [ -n "$rv_pending" ]; then rm -f "$rv_pending"; fi
  if [ -n "$rv_tmp" ]; then
    rm -f "$rv_tmp/archive.tar.gz" "$rv_tmp/SHA256SUMS" "$rv_tmp/rust-visualizer"
    rmdir "$rv_tmp" 2>/dev/null || true
  fi
}

main() {
  rv_os=$(uname -s)
  rv_arch=$(uname -m)
  case "$rv_os/$rv_arch" in
    Linux/x86_64) rv_target=x86_64-unknown-linux-musl ;;
    Linux/aarch64|Linux/arm64) rv_target=aarch64-unknown-linux-musl ;;
    Darwin/x86_64) rv_target=x86_64-apple-darwin ;;
    Darwin/arm64|Darwin/aarch64) rv_target=aarch64-apple-darwin ;;
    *) fail "Unsupported platform: $rv_os/$rv_arch (Linux/macOS x86_64 or ARM64 required)." ;;
  esac
  for rv_command in curl tar awk mktemp; do
    command -v "$rv_command" >/dev/null 2>&1 || fail "Required command not found: $rv_command"
  done
  if command -v sha256sum >/dev/null 2>&1; then
    rv_hash=sha256sum
  elif command -v shasum >/dev/null 2>&1; then
    rv_hash=shasum
  else
    fail 'SHA-256 verification requires sha256sum or shasum.'
  fi

  rv_repository=https://github.com/gu1p/rust-visualizer
  rv_latest=$(download -o /dev/null -w '%{url_effective}' "$rv_repository/releases/latest") \
    || fail 'Could not resolve the latest release. Check your connection and try again.'
  rv_tag=${rv_latest##*/}
  printf '%s\n' "$rv_tag" | LC_ALL=C grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$' \
    || fail 'Unexpected release version returned by GitHub.'
  rv_asset="rust-visualizer-$rv_tag-$rv_target.tar.gz"
  rv_url="$rv_repository/releases/download/$rv_tag"
  rv_tmp=$(mktemp -d "${TMPDIR:-/tmp}/rust-visualizer-install.XXXXXXXX")
  printf 'Downloading rust-visualizer %s for %s...\n' "$rv_tag" "$rv_target"
  download -o "$rv_tmp/SHA256SUMS" "$rv_url/SHA256SUMS" || fail 'Could not download checksums.'
  download -o "$rv_tmp/archive.tar.gz" "$rv_url/$rv_asset" || fail 'Could not download the executable archive.'
  rv_expected=$(awk -v asset="$rv_asset" '$2 == asset || $2 == "./" asset { print $1 }' "$rv_tmp/SHA256SUMS")
  [ "${#rv_expected}" -eq 64 ] || fail 'Missing or invalid checksum for this release archive.'
  case "$rv_expected" in *[!0-9a-f]*) fail 'Invalid SHA-256 checksum.' ;; esac
  if [ "$rv_hash" = sha256sum ]; then
    rv_actual=$(sha256sum "$rv_tmp/archive.tar.gz" | awk '{ print $1 }')
  else
    rv_actual=$(shasum -a 256 "$rv_tmp/archive.tar.gz" | awk '{ print $1 }')
  fi
  [ "$rv_actual" = "$rv_expected" ] || fail 'Checksum mismatch; your existing installation was not changed.'
  tar -xzf "$rv_tmp/archive.tar.gz" -C "$rv_tmp" ./rust-visualizer \
    || fail 'Could not extract the verified executable.'
  [ -f "$rv_tmp/rust-visualizer" ] && [ ! -L "$rv_tmp/rust-visualizer" ] \
    || fail 'Release archive does not contain a regular executable.'

  rv_install_dir=${RV_INSTALL_DIR:-${HOME:?Set HOME or RV_INSTALL_DIR}/.local/bin}
  mkdir -p "$rv_install_dir" || fail "Cannot create $rv_install_dir. Set RV_INSTALL_DIR to a writable directory."
  rv_pending=$(mktemp "$rv_install_dir/.rust-visualizer.XXXXXXXX")
  cp "$rv_tmp/rust-visualizer" "$rv_pending"
  chmod 755 "$rv_pending"
  [ ! -d "$rv_install_dir/rust-visualizer" ] || fail 'The installation target is a directory.'
  mv -f "$rv_pending" "$rv_install_dir/rust-visualizer"
  rv_pending=''
  printf 'Installed rust-visualizer %s to %s/rust-visualizer\n' "$rv_tag" "$rv_install_dir"
  case ":${PATH:-}:" in
    *:"$rv_install_dir":*) ;;
    *) printf 'Add this directory to your shell PATH: %s\n' "$rv_install_dir" ;;
  esac
  printf 'Run the same installer again whenever you want to update.\n'
}

rv_tmp=''
rv_pending=''
trap cleanup 0
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP
main "$@"
