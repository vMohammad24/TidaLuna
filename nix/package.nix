{ stdenv, nodejs, pnpm, fetchFromGitHub, ... }:
stdenv.mkDerivation (finalAttrs: rec {
  name = "TidaLuna";
  pname = "${name}";
  version = "1.1.0-alpha";
  src = ./..; # TODO: dont forget to change!

  nativeBuildInputs = [
    nodejs
    pnpm.configHook
  ];

  pnpmDeps = pnpm.fetchDeps {
    inherit (finalAttrs) pname src version;
    hash = "sha256-2Nf7kzmiJT7P9jNCPI16VHTPREjKR1l2yoxdtNReCx0=";
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
