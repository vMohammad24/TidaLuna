{ stdenv, nodejs, pnpm, fetchFromGitHub, ... }:
stdenv.mkDerivation (finalAttrs: rec {
  name = "TidaLuna";
  pname = "${name}";
  version = "1.6.6-beta";
  src = fetchFromGitHub {
    owner = "Inrixia";
    repo = "${name}";
    rev = "${version}";
    hash = "sha256-oZmYk3Bpq2jKzfYkbT1B8scPBlvxUrkJWCyqiM9J2S8=";
  };

  nativeBuildInputs = [
    nodejs
    pnpm.configHook
  ];

  pnpmDeps = pnpm.fetchDeps {
    inherit (finalAttrs) pname src version;
    hash = "sha256-Daah0gSdd9VYf7lf+9iCBAVI7CSvuYOd/8pmI3QBUR0=";
  };

  buildPhase = ''
    runHook preBuild

    pnpm install
    pnpm run build

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    cp -R "dist" "$out"

    runHook postInstall
  '';

})
