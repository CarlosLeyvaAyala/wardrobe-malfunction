:: This file compresses all mod files for a release version.
:: It also compresses a backup copy for a particular version of
:: the mod.
:: Read all comments before using this.
::
:: You only need to care about this file if you inherited this project
:: and need to release it. Otherwise, ignore it.
:: It isn't strictly necessary to use this, but it will surely
:: save you a lot of time.
::
:: You also need to download 7-zip for this to work.

@ECHO OFF

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Mod variables
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
SET /p ModVersion="Input the mod version you are about to release: "

:: DON'T CHANGE THESE
SET modName="Wardrobe Malfunction"

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: You need to update ALL these variables so they point towards
:: valid paths in your own computer.
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: 7 zip path
SET zipExe="C:\Program Files\7-Zip\7z.exe"

:: This points towards a dir github will ignore. It saves backups
:: for newly released versions
SET backupDir="_ignore\_backups"

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Create release zip (*.7z) file
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: See https://sevenzip.osdn.jp/chm/cmdline/index.htm
SET comp=-mx9
%zipExe% d %modName%.7z
%zipExe% a -t7z %modName%.7z "Platform\Plugins\*settings.txt" -spf2 %comp%
%zipExe% a -t7z %modName%.7z "Platform\Plugins\*.js" -spf2 %comp%

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Copy backup
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
COPY %modName%.7z %backupDir%\%modName%" "%ModVersion%.7z

PAUSE
