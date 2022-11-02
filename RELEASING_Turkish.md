# Yayınlama

> [Yayınlama aşaması] için dokumantasyonu ziyaret edin.

`master` branch üzerinde update başlatın.

`npm run release start minor` ile yayınlama branch'i başlatın.

`npm run release rc` ile yayınlama adaylığı başlatın.

`npm run release final` ile son aşamayı yayınlayın.


[OpenZeppelin Contracts yayınlama aşamaları]'nı adım adım izleyin.

[Yayınlama aşaması]: https://docs.openzeppelin.com/contracts/releases-stability
[OpenZeppelin Contracts yayınlama aşamaları]: https://github.com/OpenZeppelin/code-style/blob/master/RELEASE_CHECKLIST.md


## Yayınlama branch'i ile birleşim

Son yayınlamadan sonra yayınlama branch'i `master` ile birleşmiş olmalı. Bu birleşim ezilmemeli çünkü
aksi takdirde etiketlenmiş gönderiler kaybedilebilir. Github repoları sadece ezilmiş birleşimlere izin verdiğinden dolayı birleşim sadece local olmalı ve push edilmiş olmalı.

Local yayınlama branch'inizin son değişikliklere sahip olduğuna `upstream` ile emin olun.

```
git checkout release-vX.Y.Z
git pull upstream
```

```
git checkout master
git merge --no-ff release-vX.Y.Z
git push upstream master
```

Sonrasında GitHub üzerinden yayınlama branch'i silinebilir.
