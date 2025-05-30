{ stdenv, nodejs, pnpm, fetchFromGitHub, ... }:
stdenv.mkDerivation (finalAttrs: rec {
  name = "TidaLuna";
  pname = "${name}";
  version = "1.4.2-alpha";
  src = fetchFromGitHub {
    owner = "Inrixia";
    repo = "${name}";
    rev = "${version}";
    hash = "sha256-xwSbtCHfW6yQyMeFgRJSPQEi0kZJ3yqXVvJoBieG9uY=";
  };

  nativeBuildInputs = [
    nodejs
    pnpm.configHook
  ];

  pnpmDeps = pnpm.fetchDeps {
    inherit (finalAttrs) pname src version;
    hash = "sha256-QM5SpgvMIJ+onA1l/cZ1dgUzyZ/xvNMMOJM6PlfsJxA=";
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
