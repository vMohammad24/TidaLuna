{ stdenv, nodejs, pnpm, fetchFromGitHub, ... }:
stdenv.mkDerivation (finalAttrs: rec {
  name = "TidaLuna";
  pname = "${name}";
  version = "1.6.11-beta";
  src = fetchFromGitHub {
    owner = "Inrixia";
    repo = "${name}";
    rev = "${version}";
    hash = "sha256-PtCpgMdF9H/VqamVP2RUUAOE4J88RH09ifSeCH1HEyI=";
  };

  nativeBuildInputs = [
    nodejs
    pnpm.configHook
  ];

  pnpmDeps = pnpm.fetchDeps {
    inherit (finalAttrs) pname src version;
    hash = "sha256-TgltrHQBN/7U1bfskHhex4bTqWD5kuPVU4LYTqiK/mc=";
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
