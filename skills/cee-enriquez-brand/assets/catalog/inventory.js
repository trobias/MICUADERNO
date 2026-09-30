window.CEE_INVENTORY = {
  "date": "2026-09-07",
  "method": "Lectura estática completa de archivos TSX/CSS de interfaz, detección de patrones y mapeo de composiciones; sin ejecución productiva.",
  "summary": {
    "Partes Diarios web": 65,
    "Partes Diarios Android": 34,
    "Centinela web": 92,
    "Centinela Android": 16
  },
  "sources": [
    {
      "project": "Partes Diarios web",
      "file": "app/auth/error/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "listas",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "fc4d3b3b8b7b79f066543e7b544f59c00dac91da27c9da7234e1d3da0e2dec36",
      "evidence": [
        {
          "pattern": "botones",
          "line": 23,
          "example": "variantes-boton"
        },
        {
          "pattern": "tarjetas",
          "line": 11,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/auth/forgot-password/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "cbb8f08b0552ee03658312b0948d7aed0b4cddeb23a81fa6ca5f716331f20a3f",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "app/auth/login/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "569ce10a6563611994f6fac2867dd45ce06e6c1f6db961280fbed2edc9ee05ef",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "app/auth/sign-up/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "75dc17f55d37ed1afe5a4f16518942f021bab86f57010acb7c13e0c8e6e18bb6",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "app/auth/sign-up-success/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "75dc17f55d37ed1afe5a4f16518942f021bab86f57010acb7c13e0c8e6e18bb6",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "app/auth/update-password/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "f88abfa3abbe1c67c2341fb22a7d51a7a2326ddbf04973bd1be9fc0583a728c4",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/admin-shell.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "navbar",
        "scroll",
        "sidebar-demo",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "904a46a51f2ff722b9acdba298717ce9832ec5c04e2d46ddb658767480cbf269",
      "evidence": [
        {
          "pattern": "botones",
          "line": 148,
          "example": "variantes-boton"
        },
        {
          "pattern": "scroll",
          "line": 123,
          "example": "scroll"
        },
        {
          "pattern": "navegación",
          "line": 12,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/admin-workspace.tsx",
      "refs": [
        "campos",
        "offline",
        "selectores",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "d88661cd624a90a1d9616404ca0db25bc572907a76cdec223dbc71903cf66129",
      "evidence": [
        {
          "pattern": "botones",
          "line": 955,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 1029,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 1743,
          "example": "textarea"
        },
        {
          "pattern": "selector",
          "line": 1353,
          "example": "selectores"
        },
        {
          "pattern": "sin conexión",
          "line": 1090,
          "example": "offline"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/centros-costo/cost-centers-workspace.tsx",
      "refs": [
        "campos",
        "selectores",
        "tabla",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "cc317eafa4bb3b56b3081a591eb8f09164eeb8c4f576c44b2093547a2e88095e",
      "evidence": [
        {
          "pattern": "botones",
          "line": 226,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 390,
          "example": "campos"
        },
        {
          "pattern": "selector",
          "line": 256,
          "example": "selectores"
        },
        {
          "pattern": "tabla",
          "line": 346,
          "example": "tabla"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/centros-costo/page.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "c44b14e3cdce8156f09b5285a8141e809aa3f0bea594019ca6e7efe788e671db",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/combustible/combustible-workspace.tsx",
      "refs": [
        "ayudas",
        "campos",
        "dropdown",
        "evidencias",
        "fechas",
        "gps",
        "mapas",
        "modal",
        "navbar",
        "scroll",
        "seleccion",
        "selectores",
        "tabla",
        "teclado",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "1d50ebf798beaa8e7014a83de850741f4d0693aa8b0b19296617451924f6e896",
      "evidence": [
        {
          "pattern": "botones",
          "line": 326,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 339,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 1458,
          "example": "textarea"
        },
        {
          "pattern": "selección",
          "line": 359,
          "example": "seleccion"
        },
        {
          "pattern": "selector",
          "line": 560,
          "example": "selectores"
        },
        {
          "pattern": "fecha y hora",
          "line": 577,
          "example": "fechas"
        },
        {
          "pattern": "tabla",
          "line": 824,
          "example": "tabla"
        },
        {
          "pattern": "modal",
          "line": 1879,
          "example": "modal"
        },
        {
          "pattern": "popover",
          "line": 1345,
          "example": "ayudas"
        },
        {
          "pattern": "dropdown",
          "line": 25,
          "example": "dropdown"
        },
        {
          "pattern": "mapa",
          "line": 41,
          "example": "mapas"
        },
        {
          "pattern": "evidencias",
          "line": 34,
          "example": "evidencias"
        },
        {
          "pattern": "scroll",
          "line": 348,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 1582,
          "example": "teclado"
        },
        {
          "pattern": "navegación",
          "line": 1675,
          "example": "navbar"
        },
        {
          "pattern": "ubicación",
          "line": 1749,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/combustible/page.tsx",
      "refs": [
        "navbar"
      ],
      "exclusion": null,
      "sha256": "bd7d582cfe07e6eb075b3711877a708087207c71eba8d8f04f030cbecdc0980a",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 33,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/dispositivos/page.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "78d8dcc796dc82e5d22e8c92b778510145d08beffd9783ff69aaf33a876f2c47",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/equipos/equipos-workspace.tsx",
      "refs": [
        "campos",
        "tabla",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "dbdd8ffef8565c92ffbff420919059659d28371b36a072f43d6b5554cb354446",
      "evidence": [
        {
          "pattern": "botones",
          "line": 132,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 107,
          "example": "campos"
        },
        {
          "pattern": "tabla",
          "line": 207,
          "example": "tabla"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/equipos/page.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "9e0254f53a552df4ddea652c0890f305a3cf17e2c13a9351aca91b2b364a8a96",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/layout.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "navbar",
        "sidebar-demo"
      ],
      "exclusion": null,
      "sha256": "d0dbda9167518f16491c4295fe5905b470ddab5e1adc036cd4a3718775c8cddc",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 4,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/nav-menu.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "navbar",
        "sidebar-demo"
      ],
      "exclusion": null,
      "sha256": "b82b42410466f72d8b6a3413b571960851bc726686407a6a5a215af43a6e1606",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 83,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/operadores/operator-pin-manager.tsx",
      "refs": [
        "campos",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "5c2db976160a65026f30ba399faca9bb533c7bb78b7a3a22597bb375296d33ba",
      "evidence": [
        {
          "pattern": "botones",
          "line": 143,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 129,
          "example": "campos"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/operadores/page.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "be15c69ca41cbe5ae635527b1aee082ec92ce83beae7a9f1674694f05cf62b91",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/page.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "bb8a6c6cbae2b0eb2fb9c6b9e597bc7e097752c611663ef84bf03e187a72a1f8",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/partes-diarios-finnegans/page.tsx",
      "refs": [
        "navbar"
      ],
      "exclusion": null,
      "sha256": "6f829bfcd241f92e4f10509ee8e62dd6135a6f6f218e37476ac63865031312bf",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 13,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/partes-diarios-finnegans/partes-finnegans-workspace.tsx",
      "refs": [
        "ayudas",
        "campos",
        "error",
        "evidencias",
        "fechas",
        "modal",
        "navbar",
        "scroll",
        "seleccion",
        "selectores",
        "tabla",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "31bec5e8a1ebf3d0e9afc71e1402a3854f250bc9a0a353227f4454737adcdc30",
      "evidence": [
        {
          "pattern": "botones",
          "line": 155,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 384,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 659,
          "example": "textarea"
        },
        {
          "pattern": "selección",
          "line": 479,
          "example": "seleccion"
        },
        {
          "pattern": "selector",
          "line": 308,
          "example": "selectores"
        },
        {
          "pattern": "fecha y hora",
          "line": 393,
          "example": "fechas"
        },
        {
          "pattern": "tabla",
          "line": 473,
          "example": "tabla"
        },
        {
          "pattern": "modal",
          "line": 590,
          "example": "modal"
        },
        {
          "pattern": "popover",
          "line": 1042,
          "example": "ayudas"
        },
        {
          "pattern": "evidencias",
          "line": 17,
          "example": "evidencias"
        },
        {
          "pattern": "scroll",
          "line": 135,
          "example": "scroll"
        },
        {
          "pattern": "navegación",
          "line": 343,
          "example": "navbar"
        },
        {
          "pattern": "errores",
          "line": 909,
          "example": "error"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/pins/page.tsx",
      "refs": [
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "ede9ec78ad49334dec03d73ca0b3e3780380572c0899fc975f98023814137856",
      "evidence": [
        {
          "pattern": "botones",
          "line": 21,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/pins/pins-workspace.tsx",
      "refs": [
        "campos",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "88a86c38ebcf4adc7ac7bc79c3b527ec45051bda34ec0260098aa46fa0f1e088",
      "evidence": [
        {
          "pattern": "botones",
          "line": 214,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 228,
          "example": "campos"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/roles/page.tsx",
      "refs": [
        "permisos",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "3a9756e2e4d7d85980ad86cc25c3384a870259b3bc0404ffc0eced7fe5406c53",
      "evidence": [
        {
          "pattern": "botones",
          "line": 23,
          "example": "variantes-boton"
        },
        {
          "pattern": "permisos",
          "line": 7,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/roles/role-manager.tsx",
      "refs": [
        "campos",
        "permisos",
        "scroll",
        "tabla",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "86df928c25104a36a98ef044eb32d444bbd209f4a6cd2d0ea354442561c44f01",
      "evidence": [
        {
          "pattern": "botones",
          "line": 175,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 111,
          "example": "campos"
        },
        {
          "pattern": "tabla",
          "line": 120,
          "example": "tabla"
        },
        {
          "pattern": "scroll",
          "line": 119,
          "example": "scroll"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/unidades-negocio/page.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "f10161dc3bd3c2857198db305e02f6df29e286235a58bdd2532d3d95a4bb3004",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/users/page.tsx",
      "refs": [
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "29ea007e9bbef3cf141e8fa0c58a7bbbf13012cf5f7d71df2b12cd7c3a381ba9",
      "evidence": [
        {
          "pattern": "botones",
          "line": 29,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/users/users-workspace.tsx",
      "refs": [
        "campos",
        "scroll",
        "seleccion",
        "tabla",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "54bb262ad946758c6b61f217e0e59627e943708bd66145a0fe5ee997a286cbec",
      "evidence": [
        {
          "pattern": "botones",
          "line": 572,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 601,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 1012,
          "example": "seleccion"
        },
        {
          "pattern": "tabla",
          "line": 629,
          "example": "tabla"
        },
        {
          "pattern": "scroll",
          "line": 628,
          "example": "scroll"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/dashboard/admin/versiones/page.tsx",
      "refs": [
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "1bb7e064798e0ac69cd74f353282c4f67fb040b5b23bacca3925363ebd80dbdf",
      "evidence": [
        {
          "pattern": "botones",
          "line": 46,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/globals.css",
      "refs": [
        "ayudas",
        "geometria",
        "paleta",
        "semantica"
      ],
      "exclusion": null,
      "sha256": "1e22fb0dbf19cd658ff17f2c66d0977e4767164349b9a1612acab3238aa7c5ad",
      "evidence": [
        {
          "pattern": "popover",
          "line": 14,
          "example": "ayudas"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/layout.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "sidebar-demo",
        "tipografia"
      ],
      "exclusion": null,
      "sha256": "a2d5aa847088b1de4f2957d16e26338281abe2e94c2f242828dc38409088fdb9",
      "evidence": [
        {
          "pattern": "tipografía",
          "line": 2,
          "example": "tipografia"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/page.tsx",
      "refs": [
        "navbar",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "9424b1cfddbf14424c414b3708342140bf2536838f8c35eff13c0598177e6119",
      "evidence": [
        {
          "pattern": "botones",
          "line": 45,
          "example": "variantes-boton"
        },
        {
          "pattern": "navegación",
          "line": 29,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/protected/layout.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "navbar",
        "sidebar-demo"
      ],
      "exclusion": null,
      "sha256": "a7265131b4af7195db3e7d5f1abc50adb6bbbec9a23d9efc7686d870bef01375",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 14,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/protected/page.tsx",
      "refs": [
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "90bf8a4046ada4fcaf9ddf71672ecd505ec618c387237b3743cfa8676c727ad2",
      "evidence": [
        {
          "pattern": "botones",
          "line": 168,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/tv/fuel-tv-dashboard.tsx",
      "refs": [
        "calendario",
        "campos",
        "config-panel",
        "graficos",
        "modal",
        "navbar",
        "scroll",
        "selectores",
        "tabla",
        "tv",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "6fafb5ce51e7f7d6f0f0872e558a8f583fadedd8eea7a13514a12cb5165ff364",
      "evidence": [
        {
          "pattern": "botones",
          "line": 213,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 897,
          "example": "campos"
        },
        {
          "pattern": "selector",
          "line": 1329,
          "example": "selectores"
        },
        {
          "pattern": "calendario",
          "line": 17,
          "example": "calendario"
        },
        {
          "pattern": "tabla",
          "line": 431,
          "example": "tabla"
        },
        {
          "pattern": "modal",
          "line": 570,
          "example": "modal"
        },
        {
          "pattern": "scroll",
          "line": 357,
          "example": "scroll"
        },
        {
          "pattern": "navegación",
          "line": 176,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "app/tv/page.tsx",
      "refs": [
        "config-panel",
        "graficos",
        "tv"
      ],
      "exclusion": null,
      "sha256": "824f1c6b2f9e5ec756ae6507bb05a7f885796d2366f57d9982410585aa86e228",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "app/unauthorized/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "permisos",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "d4c9bf153e30f920a2c1e35b3a5f9d0090999bd3bfd0306fedd72d99ab10dd96",
      "evidence": [
        {
          "pattern": "botones",
          "line": 24,
          "example": "variantes-boton"
        },
        {
          "pattern": "permisos",
          "line": 14,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/auth-button.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "38fe166a53073dabd1c7ade9f3dc4f59594568dd8113112ab826595e681a29d0",
      "evidence": [
        {
          "pattern": "botones",
          "line": 29,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/auth-screen.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "eda29b2981d5520fe3cf8591e630599386f9f24ea2e7dd313d794cf87a8d4df8",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "components/dashboard/admin-tables.tsx",
      "refs": [
        "tabla"
      ],
      "exclusion": null,
      "sha256": "0e4eb93515341d7d25cdf0cadc692d16d0598e66c717d90534d27f5b745c03ad",
      "evidence": [
        {
          "pattern": "tabla",
          "line": 33,
          "example": "tabla"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/dashboard/filterable-table.tsx",
      "refs": [
        "campos",
        "scroll",
        "tabla",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "3ce1628e01312c30ab7e46901bb58d53ad7ec71961881645f4079439cb9875f1",
      "evidence": [
        {
          "pattern": "botones",
          "line": 148,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 84,
          "example": "campos"
        },
        {
          "pattern": "tabla",
          "line": 97,
          "example": "tabla"
        },
        {
          "pattern": "scroll",
          "line": 96,
          "example": "scroll"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/dashboard/page-header.tsx",
      "refs": [
        "encabezado",
        "navbar"
      ],
      "exclusion": null,
      "sha256": "3ef27547c763eea39e429841f12d29fecdf1c3420c4b32f04942410b52fc5464",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 15,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/deploy-button.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "9036d4ff6342b8c5487e0c9111012f4d7a8df4fa2f036487892d5f650dbda03b",
      "evidence": [
        {
          "pattern": "botones",
          "line": 11,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/forgot-password-form.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "gps",
        "listas",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "48b72b9bebc3bf2aa4478d74a0a9b5152721e7fcaad38778300b89ac554ef18d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 89,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 78,
          "example": "campos"
        },
        {
          "pattern": "ubicación",
          "line": 35,
          "example": "gps"
        },
        {
          "pattern": "tarjetas",
          "line": 49,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/hero.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "74f8ee58be6f6691084811e5566095c898238a7c82d782c365fcc926562ca608",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/login-form.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "listas",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "46e2c3a36dbf1489f5aa7b4755fa87ea2e6da0598be3b13cdfaa02bb553a6036",
      "evidence": [
        {
          "pattern": "botones",
          "line": 94,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 64,
          "example": "campos"
        },
        {
          "pattern": "tarjetas",
          "line": 51,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/logout-button.tsx",
      "refs": [
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "ec7340b8f0175df59e6c95ee4d80c7bbe0e1965488c065d991a796b585b55ac0",
      "evidence": [
        {
          "pattern": "botones",
          "line": 17,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/next-logo.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "fe39a3171ef3d087c7825d7663c10e159eec1858075684d5f415c2e1c9f06314",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "components/sign-out-button.tsx",
      "refs": [
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "3a049f3c7d30201a331acf5dbc95093f3eb8abfba541a2882219efa175b7d9e2",
      "evidence": [
        {
          "pattern": "botones",
          "line": 26,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/supabase-logo.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "6892b3efd4eb1b434e33fdd36033b88e010d57b9b32cf12434b5bef9a99e61da",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "components/theme-switcher.tsx",
      "refs": [
        "dropdown",
        "geometria",
        "paleta",
        "semantica",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "cdf037b53cb9cfe8e7b2edf0ea008be7cff62032e631fdb1dade3296d91cb157",
      "evidence": [
        {
          "pattern": "botones",
          "line": 33,
          "example": "variantes-boton"
        },
        {
          "pattern": "dropdown",
          "line": 5,
          "example": "dropdown"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/tutorial/code-block.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "d83c2094c0a96c162e0d02b6a75226b63f01661d766b0e1a03e8a664e6d20f6d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 50,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/tutorial/connect-supabase-steps.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "7931df9c4363f0208e7ffe80768b429296ba564c3b002d09781cb59663f99db7",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "components/tutorial/fetch-data-steps.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "473e1504b36bcb6798fb3adc438c1d40faeaf33b7a1bddc6f5917df95e9efbf7",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "components/tutorial/sign-up-user-steps.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "54cdfb2d7bd24637a316af69a36805f211ef97895d55b760fd9a8ce8a2648a00",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "components/tutorial/tutorial-step.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "2d946501c979ba061a8e88052e986bcf2a62b584ff61d7123ca5b74914121582",
      "evidence": [
        {
          "pattern": "selección",
          "line": 12,
          "example": "seleccion"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/ui/badge.tsx",
      "refs": [
        "semantica"
      ],
      "exclusion": null,
      "sha256": "81f4ea78729e7d77be773664b4a58c6b714333cec3c92fd82bcbb24136759bb0",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "components/ui/button.tsx",
      "refs": [
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "74c59ebfb218fa4368a2c3be47014ed609d0fe4b775d036a4d0a3a9329683d03",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "components/ui/card.tsx",
      "refs": [
        "listas"
      ],
      "exclusion": null,
      "sha256": "e78fcf14aff878d9aee58eb974bcb2b66cad3ab26da14b152dc459f9bc5b3008",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "components/ui/checkbox.tsx",
      "refs": [
        "seleccion"
      ],
      "exclusion": null,
      "sha256": "fa731ee7870ea0e364d0ea1e8eb36086fbaecd8f3c41b7fcbbe6d008898ce800",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "components/ui/dropdown-menu.tsx",
      "refs": [
        "ayudas",
        "dropdown",
        "scroll"
      ],
      "exclusion": null,
      "sha256": "3719651a34287cc1eb8274dd9d34b644a1aea383b5f427ab87bb62428bbae672",
      "evidence": [
        {
          "pattern": "popover",
          "line": 50,
          "example": "ayudas"
        },
        {
          "pattern": "dropdown",
          "line": 4,
          "example": "dropdown"
        },
        {
          "pattern": "scroll",
          "line": 68,
          "example": "scroll"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/ui/input.tsx",
      "refs": [
        "campos"
      ],
      "exclusion": null,
      "sha256": "92debb7d6d2d96d9e607a42d5ce8f37b2d63384ae5dd9ffbbf5f047b680ffb85",
      "evidence": [
        {
          "pattern": "campos",
          "line": 8,
          "example": "campos"
        }
      ]
    },
    {
      "project": "Partes Diarios web",
      "file": "components/ui/label.tsx",
      "refs": [
        "campos"
      ],
      "exclusion": null,
      "sha256": "969f8597a2b03f89461728c6e271fd3b6c0d3e781c2e615552e73b0db3d0a2cc",
      "evidence": []
    },
    {
      "project": "Partes Diarios web",
      "file": "components/update-password-form.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "listas",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "bf77def2ce33ffa2ebf3637d7b1f99fcbd551eee2aa2787f3d79655118c3ecf0",
      "evidence": [
        {
          "pattern": "botones",
          "line": 70,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 59,
          "example": "campos"
        },
        {
          "pattern": "tarjetas",
          "line": 46,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(auth)/_layout.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "encabezado",
        "menu-movil",
        "sidebar-demo",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "b4be20316a0c501032c28ad588591cbfe99db963b0d836da733a04dfcf035222",
      "evidence": []
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(auth)/login.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "carga",
        "seleccion",
        "teclado",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "9fc7462debb20b0b7462e5d41a5cd6a7fc05566e58536595bb4d2fd917947dda",
      "evidence": [
        {
          "pattern": "botones",
          "line": 123,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 102,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 135,
          "example": "seleccion"
        },
        {
          "pattern": "área segura",
          "line": 109,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 9,
          "example": "carga"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(auth)/register.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "carga",
        "teclado",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "e6619b594486b56ddeffaa087b73b5ca27619f6c6ac47e890a49da0bbfbbe91a",
      "evidence": [
        {
          "pattern": "botones",
          "line": 65,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 44,
          "example": "campos"
        },
        {
          "pattern": "área segura",
          "line": 51,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 9,
          "example": "carga"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/_layout.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "navbar",
        "permisos",
        "sidebar-demo"
      ],
      "exclusion": null,
      "sha256": "de412b0ff9fa2c88958b63097cc14185c201d2eaea9d31f899b69167378d30a8",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 64,
          "example": "navbar"
        },
        {
          "pattern": "permisos",
          "line": 14,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/admin.tsx",
      "refs": [
        "campos",
        "carga",
        "error",
        "modal",
        "offline",
        "permisos",
        "scroll",
        "teclado",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "f5b92a309cf6e4a154f419130e664bc75735f1d154edfbd8eefa9e5d05bc75a9",
      "evidence": [
        {
          "pattern": "botones",
          "line": 204,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 217,
          "example": "campos"
        },
        {
          "pattern": "modal",
          "line": 197,
          "example": "modal"
        },
        {
          "pattern": "scroll",
          "line": 8,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 230,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 4,
          "example": "carga"
        },
        {
          "pattern": "errores",
          "line": 94,
          "example": "error"
        },
        {
          "pattern": "sin conexión",
          "line": 781,
          "example": "offline"
        },
        {
          "pattern": "permisos",
          "line": 29,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/daily/_layout.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "sidebar-demo"
      ],
      "exclusion": null,
      "sha256": "d4b1e4ec2806a8a7ea4e67910b258f967d6b58208f6ace16dd520487c6029bf9",
      "evidence": []
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/daily/index.tsx",
      "refs": [
        "carga",
        "listas",
        "offline",
        "permisos",
        "scroll",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "e79629cab32951a573eb5e36cf20045557e8d09b05b05b4379e9bc79834e2d12",
      "evidence": [
        {
          "pattern": "botones",
          "line": 279,
          "example": "variantes-boton"
        },
        {
          "pattern": "scroll",
          "line": 7,
          "example": "scroll"
        },
        {
          "pattern": "carga",
          "line": 5,
          "example": "carga"
        },
        {
          "pattern": "sin conexión",
          "line": 22,
          "example": "offline"
        },
        {
          "pattern": "tarjetas",
          "line": 428,
          "example": "listas"
        },
        {
          "pattern": "permisos",
          "line": 29,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/daily/new.tsx",
      "refs": [
        "calendario",
        "camara-qr",
        "campos",
        "carga",
        "evidencias",
        "formulario-completo",
        "modal",
        "offline",
        "permisos",
        "scroll",
        "selectores",
        "teclado",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "12093585649c32c88c3fd58fa858ea9a5d117c09ed006f9c003ea67e1af12602",
      "evidence": [
        {
          "pattern": "botones",
          "line": 179,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 1757,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 1993,
          "example": "textarea"
        },
        {
          "pattern": "selector",
          "line": 1684,
          "example": "selectores"
        },
        {
          "pattern": "calendario",
          "line": 862,
          "example": "calendario"
        },
        {
          "pattern": "modal",
          "line": 2036,
          "example": "modal"
        },
        {
          "pattern": "cámara/QR",
          "line": 4,
          "example": "camara-qr"
        },
        {
          "pattern": "evidencias",
          "line": 5,
          "example": "evidencias"
        },
        {
          "pattern": "scroll",
          "line": 19,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 7,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 10,
          "example": "carga"
        },
        {
          "pattern": "permisos",
          "line": 92,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/fuel/_layout.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "sidebar-demo"
      ],
      "exclusion": null,
      "sha256": "2151813a090e0a31f32413238ef028ba033d6fd39d5184fe151617e9310a5b24",
      "evidence": []
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/fuel/abastecimiento-cisterna.tsx",
      "refs": [
        "campos",
        "carga",
        "error",
        "evidencias",
        "offline",
        "selectores",
        "teclado",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "9f6348f78cc28f26f94b990d31b6f73db1d8c3ae5b336131019a7896fc478204",
      "evidence": [
        {
          "pattern": "botones",
          "line": 738,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 860,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 895,
          "example": "textarea"
        },
        {
          "pattern": "selector",
          "line": 784,
          "example": "selectores"
        },
        {
          "pattern": "evidencias",
          "line": 2,
          "example": "evidencias"
        },
        {
          "pattern": "área segura",
          "line": 875,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 6,
          "example": "carga"
        },
        {
          "pattern": "errores",
          "line": 398,
          "example": "error"
        },
        {
          "pattern": "sin conexión",
          "line": 42,
          "example": "offline"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/fuel/conciliacion.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "c0b86245ab7e3f87001b8121293d029a62ae5f9f23bf2d9a6a2022be209a0f09",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/fuel/consultas.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "0211ad6f222e4bbab641e7684ae1ef6b960c92caba05e3ad0944526eda3b4913",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/fuel/despacho-equipo.tsx",
      "refs": [
        "camara-qr",
        "campos",
        "carga",
        "despacho-movil",
        "error",
        "evidencias",
        "gps",
        "modal",
        "navbar",
        "offline",
        "permisos",
        "pin-validacion",
        "scroll",
        "selectores",
        "teclado",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "fc32e17fe8982ce460c5023a06e7ec2020beb85a173c3ccc8a42bf2f6d15cd39",
      "evidence": [
        {
          "pattern": "botones",
          "line": 441,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 4007,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 4220,
          "example": "textarea"
        },
        {
          "pattern": "selector",
          "line": 3756,
          "example": "selectores"
        },
        {
          "pattern": "modal",
          "line": 4535,
          "example": "modal"
        },
        {
          "pattern": "cámara/QR",
          "line": 3,
          "example": "camara-qr"
        },
        {
          "pattern": "evidencias",
          "line": 4,
          "example": "evidencias"
        },
        {
          "pattern": "scroll",
          "line": 18,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 14,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 8,
          "example": "carga"
        },
        {
          "pattern": "navegación",
          "line": 3735,
          "example": "navbar"
        },
        {
          "pattern": "errores",
          "line": 27,
          "example": "error"
        },
        {
          "pattern": "sin conexión",
          "line": 128,
          "example": "offline"
        },
        {
          "pattern": "ubicación",
          "line": 30,
          "example": "gps"
        },
        {
          "pattern": "permisos",
          "line": 28,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/fuel/historial.tsx",
      "refs": [
        "calendario",
        "campos",
        "carga",
        "error",
        "evidencias",
        "listas",
        "mapas",
        "modal",
        "offline",
        "scroll",
        "selectores",
        "teclado",
        "variantes-boton",
        "visor"
      ],
      "exclusion": null,
      "sha256": "1fafd49477d4995324447ba82d75bcafe1b5e34c770274cbf0c1548f91ee079d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 107,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 1211,
          "example": "campos"
        },
        {
          "pattern": "selector",
          "line": 1172,
          "example": "selectores"
        },
        {
          "pattern": "calendario",
          "line": 4,
          "example": "calendario"
        },
        {
          "pattern": "modal",
          "line": 823,
          "example": "modal"
        },
        {
          "pattern": "evidencias",
          "line": 25,
          "example": "evidencias"
        },
        {
          "pattern": "scroll",
          "line": 13,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 21,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 9,
          "example": "carga"
        },
        {
          "pattern": "errores",
          "line": 22,
          "example": "error"
        },
        {
          "pattern": "sin conexión",
          "line": 45,
          "example": "offline"
        },
        {
          "pattern": "tarjetas",
          "line": 343,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/fuel/index.tsx",
      "refs": [
        "offline",
        "permisos",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "07b7b8c2c33966bd37ff7faac2036a0a456612fcea83747a6165eba1bf33bade",
      "evidence": [
        {
          "pattern": "botones",
          "line": 45,
          "example": "variantes-boton"
        },
        {
          "pattern": "sin conexión",
          "line": 14,
          "example": "offline"
        },
        {
          "pattern": "permisos",
          "line": 5,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/fuel/recepcion-externa.tsx",
      "refs": [
        "campos",
        "carga",
        "evidencias",
        "listas",
        "offline",
        "selectores",
        "teclado",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "5141c046c95363baa4b6780c0ece2915413ac81f2a850e0ec5886fc1f316fe91",
      "evidence": [
        {
          "pattern": "botones",
          "line": 559,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 647,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 730,
          "example": "textarea"
        },
        {
          "pattern": "selector",
          "line": 583,
          "example": "selectores"
        },
        {
          "pattern": "evidencias",
          "line": 3,
          "example": "evidencias"
        },
        {
          "pattern": "área segura",
          "line": 663,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 5,
          "example": "carga"
        },
        {
          "pattern": "sin conexión",
          "line": 16,
          "example": "offline"
        },
        {
          "pattern": "tarjetas",
          "line": 819,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/fuel/stock.tsx",
      "refs": [
        "campos",
        "carga",
        "listas",
        "offline",
        "selectores",
        "teclado",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "0862d5e151322031847defe93eff81995e6edf6f98db81224d79fd1ad6226199",
      "evidence": [
        {
          "pattern": "botones",
          "line": 92,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 237,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 250,
          "example": "textarea"
        },
        {
          "pattern": "selector",
          "line": 223,
          "example": "selectores"
        },
        {
          "pattern": "área segura",
          "line": 243,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 5,
          "example": "carga"
        },
        {
          "pattern": "sin conexión",
          "line": 16,
          "example": "offline"
        },
        {
          "pattern": "tarjetas",
          "line": 82,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/fuel/validacion.tsx",
      "refs": [
        "camara-qr",
        "carga",
        "gps",
        "permisos",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "bc5b5a5e6e15b7ab24d82893815b68f51b29361c79e30110ad7e585a349cff1d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 373,
          "example": "variantes-boton"
        },
        {
          "pattern": "cámara/QR",
          "line": 2,
          "example": "camara-qr"
        },
        {
          "pattern": "carga",
          "line": 6,
          "example": "carga"
        },
        {
          "pattern": "ubicación",
          "line": 47,
          "example": "gps"
        },
        {
          "pattern": "permisos",
          "line": 45,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/index.tsx",
      "refs": [
        "campos",
        "carga",
        "error",
        "evidencias",
        "offline",
        "permisos",
        "scroll",
        "teclado",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "7307d6639a3d8efb81f99fa643ab8d2c83f4f92245ee5626a2aa2e58d5d35aaf",
      "evidence": [
        {
          "pattern": "botones",
          "line": 195,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 669,
          "example": "campos"
        },
        {
          "pattern": "evidencias",
          "line": 20,
          "example": "evidencias"
        },
        {
          "pattern": "scroll",
          "line": 8,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 677,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 5,
          "example": "carga"
        },
        {
          "pattern": "errores",
          "line": 15,
          "example": "error"
        },
        {
          "pattern": "sin conexión",
          "line": 22,
          "example": "offline"
        },
        {
          "pattern": "permisos",
          "line": 31,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/(tabs)/todos.tsx",
      "refs": [
        "campos",
        "carga",
        "listas",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "01c71cc35ec7ccf6331f6d7256938ea58d547906b5e2552e23ff5ec70514533d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 45,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 75,
          "example": "campos"
        },
        {
          "pattern": "listado",
          "line": 87,
          "example": "listas"
        },
        {
          "pattern": "carga",
          "line": 10,
          "example": "carga"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/_layout.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "permisos",
        "sidebar-demo"
      ],
      "exclusion": null,
      "sha256": "3863a947ac7170a92d06e8278099e2b87831fe4e42ac7f091d96d4abacb92ca9",
      "evidence": [
        {
          "pattern": "permisos",
          "line": 9,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "app/reset-password.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "carga",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "75048a687fe47e4633bc8385a1a348d80db03d737a4f25d57a4fef62c3c879b8",
      "evidence": [
        {
          "pattern": "botones",
          "line": 69,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 59,
          "example": "campos"
        },
        {
          "pattern": "carga",
          "line": 9,
          "example": "carga"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "components/DiagnosticErrorMessage.tsx",
      "refs": [
        "error",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "b1d5aa1b383174fd287c482d18af573f51f2a5ffab8d1cda13391ce722d60756",
      "evidence": [
        {
          "pattern": "botones",
          "line": 26,
          "example": "variantes-boton"
        },
        {
          "pattern": "errores",
          "line": 9,
          "example": "error"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "components/UpdateModal.tsx",
      "refs": [
        "actualizacion",
        "carga",
        "modal",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "3fe73781ae824a96d4afcb57c4b193c06e9735f51c13e23131fea6bc4693389d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 83,
          "example": "variantes-boton"
        },
        {
          "pattern": "modal",
          "line": 60,
          "example": "modal"
        },
        {
          "pattern": "carga",
          "line": 8,
          "example": "carga"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "features/fuel/dispatch/DispatchStepFrame.tsx",
      "refs": [
        "acciones",
        "despacho-movil",
        "teclado"
      ],
      "exclusion": null,
      "sha256": "e41dc9ecb58a3b5b5696704a64d58f811316a3a1fb9f0e79a89093362cfa1beb",
      "evidence": []
    },
    {
      "project": "Partes Diarios Android",
      "file": "features/fuel/FuelCatalogBootstrapGate.tsx",
      "refs": [
        "carga",
        "error",
        "listas",
        "offline",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "0b91915bc22737744d4f3e4b86c755ff0324fb903235ff78018aba792e6cc93c",
      "evidence": [
        {
          "pattern": "botones",
          "line": 61,
          "example": "variantes-boton"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        },
        {
          "pattern": "errores",
          "line": 9,
          "example": "error"
        },
        {
          "pattern": "sin conexión",
          "line": 42,
          "example": "offline"
        },
        {
          "pattern": "tarjetas",
          "line": 37,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "features/fuel/FuelFlowTemplate.tsx",
      "refs": [
        "acciones",
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "52e68c25d7f24ee6c03c099c507b55aced1ceb51cbe30a17a299bdf0b897e9c0",
      "evidence": []
    },
    {
      "project": "Partes Diarios Android",
      "file": "features/fuel/FuelOperationHistoryUI.tsx",
      "refs": [
        "carga",
        "evidencias",
        "gps",
        "listas",
        "mapas",
        "modal",
        "scroll",
        "teclado",
        "variantes-boton",
        "visor"
      ],
      "exclusion": null,
      "sha256": "a00120966855186a8013d343ff425a6eeb2729b0f8cd6b0325e95c4b2ec441ce",
      "evidence": [
        {
          "pattern": "botones",
          "line": 46,
          "example": "variantes-boton"
        },
        {
          "pattern": "modal",
          "line": 182,
          "example": "modal"
        },
        {
          "pattern": "mapa",
          "line": 23,
          "example": "mapas"
        },
        {
          "pattern": "evidencias",
          "line": 17,
          "example": "evidencias"
        },
        {
          "pattern": "scroll",
          "line": 8,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 14,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 4,
          "example": "carga"
        },
        {
          "pattern": "ubicación",
          "line": 377,
          "example": "gps"
        },
        {
          "pattern": "tarjetas",
          "line": 47,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "features/fuel/FuelPinValidationPanel.tsx",
      "refs": [
        "campos",
        "carga",
        "gps",
        "listas",
        "pin-validacion",
        "teclado",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "8ab56fe3835805dcd69235c14274591cc267810f8e432d3bd12d821bcbe19e02",
      "evidence": [
        {
          "pattern": "botones",
          "line": 185,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 230,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 251,
          "example": "textarea"
        },
        {
          "pattern": "área segura",
          "line": 5,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        },
        {
          "pattern": "ubicación",
          "line": 14,
          "example": "gps"
        },
        {
          "pattern": "tarjetas",
          "line": 218,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "features/fuel/FuelValidationRequestLayer.tsx",
      "refs": [
        "camara-qr",
        "carga",
        "error",
        "gps",
        "listas",
        "modal",
        "permisos",
        "pin-validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "a211960836f6521a15e068c0fa9fddd95bfb965c77916201e5d66a6e2df71a84",
      "evidence": [
        {
          "pattern": "botones",
          "line": 315,
          "example": "variantes-boton"
        },
        {
          "pattern": "modal",
          "line": 263,
          "example": "modal"
        },
        {
          "pattern": "cámara/QR",
          "line": 21,
          "example": "camara-qr"
        },
        {
          "pattern": "carga",
          "line": 5,
          "example": "carga"
        },
        {
          "pattern": "errores",
          "line": 69,
          "example": "error"
        },
        {
          "pattern": "ubicación",
          "line": 13,
          "example": "gps"
        },
        {
          "pattern": "tarjetas",
          "line": 270,
          "example": "listas"
        },
        {
          "pattern": "permisos",
          "line": 12,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "features/fuel/NativeQrCode.tsx",
      "refs": [
        "camara-qr"
      ],
      "exclusion": null,
      "sha256": "5d075624028ce2a735b111503c08cbe622a18c10876d7a0e2bc03d35184bcc75",
      "evidence": [
        {
          "pattern": "cámara/QR",
          "line": 1,
          "example": "camara-qr"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "features/fuel/ui.tsx",
      "refs": [
        "acciones",
        "ayudas",
        "campos",
        "carga",
        "listas",
        "modal",
        "permisos",
        "restringido",
        "scroll",
        "selectores",
        "teclado",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "0e84fe5608535bdbbd527b09c798e13a9cf2dd30785ec6f391aa2583054637ee",
      "evidence": [
        {
          "pattern": "botones",
          "line": 158,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 341,
          "example": "campos"
        },
        {
          "pattern": "listado",
          "line": 458,
          "example": "listas"
        },
        {
          "pattern": "modal",
          "line": 238,
          "example": "modal"
        },
        {
          "pattern": "scroll",
          "line": 6,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 461,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 2,
          "example": "carga"
        },
        {
          "pattern": "permisos",
          "line": 24,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Partes Diarios Android",
      "file": "widgets/DespachoEquipoWidget.tsx",
      "refs": [
        "widget"
      ],
      "exclusion": null,
      "sha256": "0022e43f75837f15f53306c270d765854e189d6979788442c5aefa84971477da",
      "evidence": []
    },
    {
      "project": "Partes Diarios Android",
      "file": "widgets/widgetTaskHandler.tsx",
      "refs": [
        "widget"
      ],
      "exclusion": null,
      "sha256": "afb1d73a91a2527514acea1c57393724913de1585cb3981b682fccf8c9f68efc",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "app/auth/error/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "listas",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "df067dc301ffbb1656241c5fc6fbdf38cba760bb233c8b2ffbc6a7a553c4b75a",
      "evidence": [
        {
          "pattern": "tarjetas",
          "line": 14,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/auth/forgot-password/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "bfc8336bf7df9c9706a0e4dd2c33e199d478b8f5e08e5746a9f12cd5f7bf815e",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "app/auth/login/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "1d7f6acbf96597e687083d3b31e9fcba20975ed245699b9c10519d42b4c7ccd4",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "app/auth/sign-up/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "e820df64c67f45c8b41b54e2677d85b23754198dd174ea13bc254840f07ca519",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "app/auth/sign-up-success/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "listas",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "75f7c9f60351913937836e032dcd74500f1f8c1d1734db8eab94894beb99645e",
      "evidence": [
        {
          "pattern": "tarjetas",
          "line": 14,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/auth/update-password/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion"
      ],
      "exclusion": null,
      "sha256": "e358a4c046cc118eb6a24e077d2ddd0017f6c82d3f7c4ece1fd03e2e73dbce97",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "app/compartidas/novedades/[token]/page.tsx",
      "refs": [
        "evidencias"
      ],
      "exclusion": null,
      "sha256": "d15ee63aa3362f797e4d2597999e0f4e383a07b608044e231125d3b8b680ab85",
      "evidence": [
        {
          "pattern": "evidencias",
          "line": 3,
          "example": "evidencias"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/dispositivos/device-list.tsx",
      "refs": [
        "campos",
        "seleccion",
        "selectores",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "eb172e95f006b3a4279cdb7ae4d2565c8da2b41adfbc3f4942cddb3941e11034",
      "evidence": [
        {
          "pattern": "botones",
          "line": 227,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 263,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 320,
          "example": "seleccion"
        },
        {
          "pattern": "selector",
          "line": 282,
          "example": "selectores"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/dispositivos/page.tsx",
      "refs": [
        "navbar"
      ],
      "exclusion": null,
      "sha256": "41df66fb75b7f8ef448a5eaeeb5c2fe757c1dd8236cbcc4282517aa871a4a4e6",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 15,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/empresas/create-empresa-form.tsx",
      "refs": [
        "campos",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "12b7752c2b514f36c2b8984f7b29aa8945db49d81d388a14d1679f9826f16835",
      "evidence": [
        {
          "pattern": "botones",
          "line": 52,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 34,
          "example": "campos"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/empresas/empresa-list.tsx",
      "refs": [
        "campos",
        "tabla",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "f8415dc6a71622747590c26237af93b4f93d03ea254f538851c50088fadeb389",
      "evidence": [
        {
          "pattern": "botones",
          "line": 84,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 63,
          "example": "campos"
        },
        {
          "pattern": "tabla",
          "line": 266,
          "example": "tabla"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/empresas/page.tsx",
      "refs": [
        "navbar"
      ],
      "exclusion": null,
      "sha256": "f4b307732f22b9a11bd456240f30d427c25168d6f85c04fc0f4b807cf9cd450e",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 13,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/guardias/create-guardia-form.tsx",
      "refs": [
        "campos",
        "seleccion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "3467817fb69d47e53fa8f259af730b15d7d50b2ce3729c07f15edf44c01847ce",
      "evidence": [
        {
          "pattern": "botones",
          "line": 88,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 33,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 60,
          "example": "seleccion"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/guardias/guardia-list.tsx",
      "refs": [
        "campos",
        "seleccion",
        "tabla",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "9765f4eaf1969817fb5d86f16258f66712b9533a9eccc096d4643ae832d6e4ea",
      "evidence": [
        {
          "pattern": "botones",
          "line": 106,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 56,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 84,
          "example": "seleccion"
        },
        {
          "pattern": "tabla",
          "line": 295,
          "example": "tabla"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/guardias/page.tsx",
      "refs": [
        "navbar"
      ],
      "exclusion": null,
      "sha256": "12d367bc479aabea3918561801c27aed878ceb27a74d157162b4bbc43e22d4d4",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 17,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/layout.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "navbar",
        "scroll",
        "sidebar-demo",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "57b26ce9bb8140643879ac205552f4a695d9918f84a3f7c2148c5c9d4d237e1d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 67,
          "example": "variantes-boton"
        },
        {
          "pattern": "scroll",
          "line": 110,
          "example": "scroll"
        },
        {
          "pattern": "navegación",
          "line": 10,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/live-device-map.tsx",
      "refs": [
        "ayudas",
        "gps",
        "mapas",
        "scroll",
        "tipografia"
      ],
      "exclusion": null,
      "sha256": "51e500db0093eedbd0327443c1846fb230fb4c1fe8ec57066a8799d3b059dea7",
      "evidence": [
        {
          "pattern": "popover",
          "line": 329,
          "example": "ayudas"
        },
        {
          "pattern": "mapa",
          "line": 7,
          "example": "mapas"
        },
        {
          "pattern": "scroll",
          "line": 239,
          "example": "scroll"
        },
        {
          "pattern": "ubicación",
          "line": 20,
          "example": "gps"
        },
        {
          "pattern": "tipografía",
          "line": 487,
          "example": "tipografia"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/maestros/page.tsx",
      "refs": [
        "listas",
        "navbar",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "291a3c99f29ce03a587b022978e7df11cbbee2e437944f7ec7c2378e50393aaf",
      "evidence": [
        {
          "pattern": "botones",
          "line": 43,
          "example": "variantes-boton"
        },
        {
          "pattern": "navegación",
          "line": 23,
          "example": "navbar"
        },
        {
          "pattern": "tarjetas",
          "line": 32,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/nav-menu.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "navbar",
        "sidebar-demo"
      ],
      "exclusion": null,
      "sha256": "932df204bb05c6577614cb80badaf83e2581208684088ffe195ecd6c00c651d9",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 43,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/novedades/novedad-list.tsx",
      "refs": [
        "ayudas",
        "calendario",
        "campos",
        "evidencias",
        "gps",
        "mapas",
        "navbar",
        "scroll",
        "seleccion",
        "selectores",
        "tabla",
        "teclado",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "7bba3ad01de281fc90a795b8f08d3ed132e603ffa1bf6d9d3acb7d8a43327084",
      "evidence": [
        {
          "pattern": "botones",
          "line": 1086,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 1031,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 1610,
          "example": "seleccion"
        },
        {
          "pattern": "selector",
          "line": 1187,
          "example": "selectores"
        },
        {
          "pattern": "calendario",
          "line": 8,
          "example": "calendario"
        },
        {
          "pattern": "tabla",
          "line": 1285,
          "example": "tabla"
        },
        {
          "pattern": "popover",
          "line": 16,
          "example": "ayudas"
        },
        {
          "pattern": "mapa",
          "line": 28,
          "example": "mapas"
        },
        {
          "pattern": "evidencias",
          "line": 78,
          "example": "evidencias"
        },
        {
          "pattern": "scroll",
          "line": 1284,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 1718,
          "example": "teclado"
        },
        {
          "pattern": "navegación",
          "line": 1387,
          "example": "navbar"
        },
        {
          "pattern": "ubicación",
          "line": 58,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/novedades/page.tsx",
      "refs": [
        "evidencias",
        "navbar"
      ],
      "exclusion": null,
      "sha256": "3392446b7be48cfe9b0ebb22e99099852d77fa4fde81d96044d1560b6bc1797a",
      "evidence": [
        {
          "pattern": "evidencias",
          "line": 98,
          "example": "evidencias"
        },
        {
          "pattern": "navegación",
          "line": 95,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/page.tsx",
      "refs": [
        "gps",
        "mapas",
        "navbar"
      ],
      "exclusion": null,
      "sha256": "5af7df1fdb9b57b67db064ab30e025df5ab8733fd4887b96f089a20d37ceb36c",
      "evidence": [
        {
          "pattern": "mapa",
          "line": 6,
          "example": "mapas"
        },
        {
          "pattern": "navegación",
          "line": 20,
          "example": "navbar"
        },
        {
          "pattern": "ubicación",
          "line": 5,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/puestos/create-puesto-form.tsx",
      "refs": [
        "campos",
        "gps",
        "seleccion",
        "selectores",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "11d24f23e4089c0011345c41bec701f0355995edf7a5434645a258c3ca75b349",
      "evidence": [
        {
          "pattern": "botones",
          "line": 155,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 47,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 89,
          "example": "seleccion"
        },
        {
          "pattern": "selector",
          "line": 72,
          "example": "selectores"
        },
        {
          "pattern": "ubicación",
          "line": 36,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/puestos/page.tsx",
      "refs": [
        "navbar"
      ],
      "exclusion": null,
      "sha256": "59d2a5450bad9b295acdc9bd6a046668cc3fd13b9ca16a8f81dfd18d7b25604f",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 17,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/puestos/puesto-list.tsx",
      "refs": [
        "campos",
        "gps",
        "scroll",
        "seleccion",
        "selectores",
        "tabla",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "39ea6e3c6346054d4953a85f7b66c975dfc06d1616f242389f1798a79f01b09d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 215,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 104,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 146,
          "example": "seleccion"
        },
        {
          "pattern": "selector",
          "line": 128,
          "example": "selectores"
        },
        {
          "pattern": "tabla",
          "line": 306,
          "example": "tabla"
        },
        {
          "pattern": "scroll",
          "line": 305,
          "example": "scroll"
        },
        {
          "pattern": "ubicación",
          "line": 40,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/puntos-control/create-punto-control-form.tsx",
      "refs": [
        "campos",
        "gps",
        "selectores",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "90b240dced3ecf3ee40eeed80770166aa547832ea5602d95af71d85a686750c4",
      "evidence": [
        {
          "pattern": "botones",
          "line": 86,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 41,
          "example": "campos"
        },
        {
          "pattern": "selector",
          "line": 58,
          "example": "selectores"
        },
        {
          "pattern": "ubicación",
          "line": 78,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/puntos-control/page.tsx",
      "refs": [
        "navbar"
      ],
      "exclusion": null,
      "sha256": "7550a944c8b838c383be0615b52d94984312566f5da9659043ede6e5b7854b2c",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 18,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/puntos-control/punto-control-list.tsx",
      "refs": [
        "campos",
        "gps",
        "listas",
        "navbar",
        "scroll",
        "selectores",
        "tabla",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "c21c170f58ead8e3c3596e97431d63dfbe372ad4bde5bed80cd1c24f66088d7d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 142,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 101,
          "example": "campos"
        },
        {
          "pattern": "selector",
          "line": 118,
          "example": "selectores"
        },
        {
          "pattern": "tabla",
          "line": 230,
          "example": "tabla"
        },
        {
          "pattern": "scroll",
          "line": 229,
          "example": "scroll"
        },
        {
          "pattern": "navegación",
          "line": 342,
          "example": "navbar"
        },
        {
          "pattern": "ubicación",
          "line": 51,
          "example": "gps"
        },
        {
          "pattern": "tarjetas",
          "line": 478,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/recorridas/page.tsx",
      "refs": [
        "mapas",
        "navbar",
        "recorridas",
        "tabla",
        "timeline"
      ],
      "exclusion": null,
      "sha256": "8c7f413cb4430ce5863a4334f6110f8bf0cf3c1627497475207225747897a25a",
      "evidence": [
        {
          "pattern": "tabla",
          "line": 19,
          "example": "tabla"
        },
        {
          "pattern": "navegación",
          "line": 12,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/recorridas/recorridas-table.tsx",
      "refs": [
        "campos",
        "mapas",
        "recorridas",
        "scroll",
        "selectores",
        "tabla",
        "timeline",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "272836c7e409c9548eb396960e93eea47f00e27c5a2f56e899009db6fa06b985",
      "evidence": [
        {
          "pattern": "botones",
          "line": 300,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 242,
          "example": "campos"
        },
        {
          "pattern": "selector",
          "line": 226,
          "example": "selectores"
        },
        {
          "pattern": "tabla",
          "line": 176,
          "example": "tabla"
        },
        {
          "pattern": "mapa",
          "line": 7,
          "example": "mapas"
        },
        {
          "pattern": "scroll",
          "line": 175,
          "example": "scroll"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/roles/page.tsx",
      "refs": [
        "navbar",
        "permisos"
      ],
      "exclusion": null,
      "sha256": "a611d7c7d466462633049e4343db2cd83ac7cceeed096df9bb54624cc0f855dc",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 28,
          "example": "navbar"
        },
        {
          "pattern": "permisos",
          "line": 10,
          "example": "permisos"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/roles/role-manager.tsx",
      "refs": [
        "campos",
        "permisos",
        "scroll",
        "seleccion",
        "selectores",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "b4c9927568fa5c1d39ff8ac748b6af680853d587cbdf204ac1fe885e7233adb7",
      "evidence": [
        {
          "pattern": "botones",
          "line": 181,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 133,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 266,
          "example": "seleccion"
        },
        {
          "pattern": "selector",
          "line": 239,
          "example": "selectores"
        },
        {
          "pattern": "scroll",
          "line": 259,
          "example": "scroll"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/tipos-novedades/create-tipo-novedad-form.tsx",
      "refs": [
        "campos",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "b093fdeea7488269aa49376d3a609bfc594b1598b08d93defcafcd53da3fecac",
      "evidence": [
        {
          "pattern": "botones",
          "line": 71,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 41,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 51,
          "example": "textarea"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/tipos-novedades/page.tsx",
      "refs": [
        "navbar"
      ],
      "exclusion": null,
      "sha256": "e94bfe9ed5f96f4a2d4953c39206c7bc436aa9e9dee56c38c358eefdf07490c8",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 14,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/tipos-novedades/puesto-assignment-selector.tsx",
      "refs": [
        "campos",
        "scroll",
        "seleccion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "207ee3596c7b1a1625549cd1337c4bb62e645209f36552b2910d02add4f2ecd5",
      "evidence": [
        {
          "pattern": "botones",
          "line": 92,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 121,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 122,
          "example": "seleccion"
        },
        {
          "pattern": "scroll",
          "line": 111,
          "example": "scroll"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/tipos-novedades/tipo-novedad-list.tsx",
      "refs": [
        "campos",
        "scroll",
        "tabla",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "ee3c313d819877469caaca783f2744a5ac98f6042e3d0764f77d55bc271b0640",
      "evidence": [
        {
          "pattern": "botones",
          "line": 97,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 123,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 151,
          "example": "textarea"
        },
        {
          "pattern": "tabla",
          "line": 299,
          "example": "tabla"
        },
        {
          "pattern": "scroll",
          "line": 121,
          "example": "scroll"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/unidades/create-unidad-form.tsx",
      "refs": [
        "campos",
        "selectores",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "ec04660c512e37c1b4edec47e09d8b0cd0fbef54594be60d4181ba2e372120a2",
      "evidence": [
        {
          "pattern": "botones",
          "line": 79,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 42,
          "example": "campos"
        },
        {
          "pattern": "selector",
          "line": 53,
          "example": "selectores"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/unidades/page.tsx",
      "refs": [
        "navbar"
      ],
      "exclusion": null,
      "sha256": "2492b074808aa6b457d117bf2509c792deab5d9c15307ee3aef9c1eb318226f1",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 18,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/admin/unidades/unidad-list.tsx",
      "refs": [
        "campos",
        "selectores",
        "tabla",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "d206cc7b0665bf84e47d65df41f32006379882bc16f4244202afa60c386f01e6",
      "evidence": [
        {
          "pattern": "botones",
          "line": 99,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 66,
          "example": "campos"
        },
        {
          "pattern": "selector",
          "line": 78,
          "example": "selectores"
        },
        {
          "pattern": "tabla",
          "line": 276,
          "example": "tabla"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/guardia/layout.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "navbar",
        "scroll",
        "sidebar-demo",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "db9670b223f930d0e99ac8c6f6c055c8059b28c382a3f8d6ecffe2fdb2e29b6e",
      "evidence": [
        {
          "pattern": "botones",
          "line": 65,
          "example": "variantes-boton"
        },
        {
          "pattern": "scroll",
          "line": 108,
          "example": "scroll"
        },
        {
          "pattern": "navegación",
          "line": 10,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/guardia/nav-menu.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "navbar",
        "sidebar-demo"
      ],
      "exclusion": null,
      "sha256": "cd20ef5575c59640ab334df2ee35677e1dfdd18499314a073262e2367e4507f2",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 22,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/guardia/novedades/create-novedad-form.tsx",
      "refs": [
        "campos",
        "evidencias",
        "formulario-completo",
        "offline",
        "selectores",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "8c5e556f591b855a76256875f9c4f9ea01978f5714d825a46fcf15b5919b112a",
      "evidence": [
        {
          "pattern": "botones",
          "line": 172,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 141,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 151,
          "example": "textarea"
        },
        {
          "pattern": "selector",
          "line": 77,
          "example": "selectores"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/guardia/novedades/create-novedad-modal.tsx",
      "refs": [
        "evidencias",
        "formulario-completo",
        "offline",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "732d3f8b796d379624cb5400654c4704d00441d28f51c849e7eca1d52315308e",
      "evidence": [
        {
          "pattern": "botones",
          "line": 39,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/guardia/novedades/page.tsx",
      "refs": [
        "gps",
        "navbar"
      ],
      "exclusion": null,
      "sha256": "220ff5fa73bb0a50c0b26e3ca2233fdee1bc7151af950671962bece8b35a41da",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 113,
          "example": "navbar"
        },
        {
          "pattern": "ubicación",
          "line": 156,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/guardia/page.tsx",
      "refs": [
        "navbar",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "6ba43bc62fee43b694a21bbefd86c76da872dfb01ce7fd42cbec6788e87b4c77",
      "evidence": [
        {
          "pattern": "botones",
          "line": 25,
          "example": "variantes-boton"
        },
        {
          "pattern": "navegación",
          "line": 18,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/guardia/recorridas/page.tsx",
      "refs": [
        "mapas",
        "navbar",
        "recorridas",
        "tabla",
        "timeline"
      ],
      "exclusion": null,
      "sha256": "e3e1ac488447ac88dff0b3801d12081c54a97ec7dc5704ce3c00cbb51068a8d4",
      "evidence": [
        {
          "pattern": "tabla",
          "line": 40,
          "example": "tabla"
        },
        {
          "pattern": "navegación",
          "line": 21,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/supervisor/layout.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "navbar",
        "scroll",
        "sidebar-demo",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "321063fd9a436e03284712553fa3909c5ebdd7fc4c579ad7ea410c881b43e59f",
      "evidence": [
        {
          "pattern": "botones",
          "line": 65,
          "example": "variantes-boton"
        },
        {
          "pattern": "scroll",
          "line": 108,
          "example": "scroll"
        },
        {
          "pattern": "navegación",
          "line": 10,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/supervisor/nav-menu.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "navbar",
        "sidebar-demo"
      ],
      "exclusion": null,
      "sha256": "506f26b629af8ad720ca865637db1b457ea3804621b9f75b0631429c3151b8bc",
      "evidence": [
        {
          "pattern": "navegación",
          "line": 22,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/supervisor/novedades/page.tsx",
      "refs": [
        "evidencias",
        "navbar"
      ],
      "exclusion": null,
      "sha256": "b4782e7014ef4907cab02b6b3d76b8914e765e0fa75a212a293f71921cf3d040",
      "evidence": [
        {
          "pattern": "evidencias",
          "line": 113,
          "example": "evidencias"
        },
        {
          "pattern": "navegación",
          "line": 110,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/supervisor/page.tsx",
      "refs": [
        "evidencias",
        "gps",
        "listas",
        "navbar"
      ],
      "exclusion": null,
      "sha256": "e0b26a770d8cb5b7e2db2bfdbb8f88f86f8105f830fc5ffe9ef5a77dcf83aed1",
      "evidence": [
        {
          "pattern": "evidencias",
          "line": 16,
          "example": "evidencias"
        },
        {
          "pattern": "navegación",
          "line": 30,
          "example": "navbar"
        },
        {
          "pattern": "ubicación",
          "line": 66,
          "example": "gps"
        },
        {
          "pattern": "tarjetas",
          "line": 80,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/supervisor/recorridas/page.tsx",
      "refs": [
        "mapas",
        "navbar",
        "recorridas",
        "tabla",
        "timeline"
      ],
      "exclusion": null,
      "sha256": "909c0ad087ba51cd6d5813b6acbeecf9101a18320ce065f4f13249c17feb440e",
      "evidence": [
        {
          "pattern": "tabla",
          "line": 25,
          "example": "tabla"
        },
        {
          "pattern": "navegación",
          "line": 18,
          "example": "navbar"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/dashboard/visitante/page.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "e1fd21fd1e3f1089142a9930542058489ea84137c8c697ad76ca10ef09f2b88d",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/globals.css",
      "refs": [
        "ayudas",
        "geometria",
        "mapas",
        "paleta",
        "semantica"
      ],
      "exclusion": null,
      "sha256": "ae73676c224359d93342492f5ee82a3450d9b6d748c9a103aaa61f099b1d0907",
      "evidence": [
        {
          "pattern": "popover",
          "line": 11,
          "example": "ayudas"
        },
        {
          "pattern": "mapa",
          "line": 71,
          "example": "mapas"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/instruments/file.tsx",
      "refs": [],
      "exclusion": "Archivo sin componente visual propio; no requiere ejemplo independiente.",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "app/landing-content.tsx",
      "refs": [
        "gps",
        "navbar",
        "tipografia",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "b8734bc300f4715d74b4cd44cbb7c970bc006dda8c241507b23374e56a0e9961",
      "evidence": [
        {
          "pattern": "botones",
          "line": 31,
          "example": "variantes-boton"
        },
        {
          "pattern": "navegación",
          "line": 19,
          "example": "navbar"
        },
        {
          "pattern": "ubicación",
          "line": 135,
          "example": "gps"
        },
        {
          "pattern": "tipografía",
          "line": 7,
          "example": "tipografia"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/layout.tsx",
      "refs": [
        "encabezado",
        "mapas",
        "menu-movil",
        "sidebar-demo",
        "tipografia"
      ],
      "exclusion": null,
      "sha256": "71e239aea007243f530232be9298fd34beff1add71e404e5c555f8e501b1fd57",
      "evidence": [
        {
          "pattern": "mapa",
          "line": 4,
          "example": "mapas"
        },
        {
          "pattern": "tipografía",
          "line": 2,
          "example": "tipografia"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/novedades/adjuntos/[token]/page.tsx",
      "refs": [
        "evidencias",
        "gps"
      ],
      "exclusion": null,
      "sha256": "e079d12afeeeb18a7554ed60374f073dd251e23b2d49841eabb5c714eb0cd9a6",
      "evidence": [
        {
          "pattern": "evidencias",
          "line": 6,
          "example": "evidencias"
        },
        {
          "pattern": "ubicación",
          "line": 108,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/page.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "223c9d6e530ca77907363ba35b81431cd20019fc835eeefeaba52d4ff5974750",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/protected/layout.tsx",
      "refs": [
        "encabezado",
        "menu-movil",
        "sidebar-demo"
      ],
      "exclusion": null,
      "sha256": "53aa7a64e57199c4b4534df86ad59e7e46a08f101f94642f0bd9d237732f76d1",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "app/protected/page.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "ee007f8493ff747d2fd385ea49ce72970c7448fe41c4398fab75ffc590ffa396",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "app/unauthorized/page.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "ac589b6e02acd2459f65b3726007ad5c57b93c25b8192a5a7832abd9a912af3b",
      "evidence": [
        {
          "pattern": "botones",
          "line": 18,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/auth-button.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "93b25ddb3a901f7de6084ad3d2233d9fbc7908da2578f7f87ed8abf550b1901d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 21,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/deploy-button.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "9036d4ff6342b8c5487e0c9111012f4d7a8df4fa2f036487892d5f650dbda03b",
      "evidence": [
        {
          "pattern": "botones",
          "line": 11,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/env-var-warning.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "fe38cff6a3294970757b34ffb38b5471041fc50e464667820f3577c99ceb4d6a",
      "evidence": [
        {
          "pattern": "botones",
          "line": 11,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/forgot-password-form.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "gps",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "b1e17b1369b12022470a98866312b1beebd2f93161a52edfeafbc2c45d453549",
      "evidence": [
        {
          "pattern": "botones",
          "line": 70,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 89,
          "example": "campos"
        },
        {
          "pattern": "ubicación",
          "line": 29,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/hero.tsx",
      "refs": [
        "encabezado"
      ],
      "exclusion": null,
      "sha256": "74f8ee58be6f6691084811e5566095c898238a7c82d782c365fcc926562ca608",
      "evidence": [
        {
          "pattern": "composición JSX sin primitiva visual independiente",
          "line": 1,
          "example": "encabezado"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/login-form.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "seleccion",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "55e1ec794cb359dfa43f786b4da3d3f21230f6a000256c0ca9cefa4039c876ba",
      "evidence": [
        {
          "pattern": "botones",
          "line": 109,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 80,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 125,
          "example": "seleccion"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/logout-button.tsx",
      "refs": [
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "309312238fb46d121cdc8b06f16ee0856bb62d0df079c28ac14b5f43d9c5d311",
      "evidence": [
        {
          "pattern": "botones",
          "line": 16,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/maps/map-path-viewer.tsx",
      "refs": [
        "mapas"
      ],
      "exclusion": null,
      "sha256": "d1ff1b318f5524529a916ef994750fa29dc5128ecf98fdcadd0f657c4b5f8f19",
      "evidence": [
        {
          "pattern": "mapa",
          "line": 6,
          "example": "mapas"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/maps/map-picker.tsx",
      "refs": [
        "gps",
        "mapas"
      ],
      "exclusion": null,
      "sha256": "d335749a23c26fbcae0bf28a089a4b3db2f48c2028e483eaed1ddffccbfb2c93",
      "evidence": [
        {
          "pattern": "mapa",
          "line": 5,
          "example": "mapas"
        },
        {
          "pattern": "ubicación",
          "line": 13,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/maps/map-viewer.tsx",
      "refs": [
        "gps",
        "mapas"
      ],
      "exclusion": null,
      "sha256": "9742ddfae8447e3a6d24a3382d49d7b16bb34dafc644109215dbbe3ac59ee3d2",
      "evidence": [
        {
          "pattern": "mapa",
          "line": 3,
          "example": "mapas"
        },
        {
          "pattern": "ubicación",
          "line": 8,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/next-logo.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "fe39a3171ef3d087c7825d7663c10e159eec1858075684d5f415c2e1c9f06314",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "components/sign-out-button.tsx",
      "refs": [
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "33bcded7fc221dce582794f82bb593109c4a1bd0edbadd6ec248727678709bec",
      "evidence": [
        {
          "pattern": "botones",
          "line": 21,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/sign-up-form.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "gps",
        "listas",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "2a0ecf5a448e9a18321a2e25945ef9909e435e0f4f4810f3007894068e61e100",
      "evidence": [
        {
          "pattern": "botones",
          "line": 105,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 71,
          "example": "campos"
        },
        {
          "pattern": "ubicación",
          "line": 47,
          "example": "gps"
        },
        {
          "pattern": "tarjetas",
          "line": 61,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/supabase-logo.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "6892b3efd4eb1b434e33fdd36033b88e010d57b9b32cf12434b5bef9a99e61da",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "components/theme-switcher.tsx",
      "refs": [
        "dropdown",
        "geometria",
        "paleta",
        "semantica",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "cdf037b53cb9cfe8e7b2edf0ea008be7cff62032e631fdb1dade3296d91cb157",
      "evidence": [
        {
          "pattern": "botones",
          "line": 33,
          "example": "variantes-boton"
        },
        {
          "pattern": "dropdown",
          "line": 5,
          "example": "dropdown"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/tutorial/code-block.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "d83c2094c0a96c162e0d02b6a75226b63f01661d766b0e1a03e8a664e6d20f6d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 50,
          "example": "variantes-boton"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/tutorial/connect-supabase-steps.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "7931df9c4363f0208e7ffe80768b429296ba564c3b002d09781cb59663f99db7",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "components/tutorial/fetch-data-steps.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "473e1504b36bcb6798fb3adc438c1d40faeaf33b7a1bddc6f5917df95e9efbf7",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "components/tutorial/sign-up-user-steps.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "54cdfb2d7bd24637a316af69a36805f211ef97895d55b760fd9a8ce8a2648a00",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "components/tutorial/tutorial-step.tsx",
      "refs": [],
      "exclusion": "Recurso de plantilla/proveedor: sin variante de marca propia. No se copia al catálogo.",
      "sha256": "2d946501c979ba061a8e88052e986bcf2a62b584ff61d7123ca5b74914121582",
      "evidence": [
        {
          "pattern": "selección",
          "line": 12,
          "example": "seleccion"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/ui/badge.tsx",
      "refs": [
        "semantica"
      ],
      "exclusion": null,
      "sha256": "81f4ea78729e7d77be773664b4a58c6b714333cec3c92fd82bcbb24136759bb0",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "components/ui/button.tsx",
      "refs": [
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "a9abd92efba1330f07229e0981f053591833d430dacb7c7f9f196f6666c72f41",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "components/ui/calendar.tsx",
      "refs": [
        "calendario"
      ],
      "exclusion": null,
      "sha256": "da8a48f6297b8f0cf070c531c4a789ab7d74cee528bf9a5c831de1d39977f024",
      "evidence": [
        {
          "pattern": "calendario",
          "line": 4,
          "example": "calendario"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/ui/card.tsx",
      "refs": [
        "listas"
      ],
      "exclusion": null,
      "sha256": "e78fcf14aff878d9aee58eb974bcb2b66cad3ab26da14b152dc459f9bc5b3008",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "components/ui/checkbox.tsx",
      "refs": [
        "seleccion"
      ],
      "exclusion": null,
      "sha256": "fa731ee7870ea0e364d0ea1e8eb36086fbaecd8f3c41b7fcbbe6d008898ce800",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "components/ui/dropdown-menu.tsx",
      "refs": [
        "ayudas",
        "dropdown",
        "scroll"
      ],
      "exclusion": null,
      "sha256": "3719651a34287cc1eb8274dd9d34b644a1aea383b5f427ab87bb62428bbae672",
      "evidence": [
        {
          "pattern": "popover",
          "line": 50,
          "example": "ayudas"
        },
        {
          "pattern": "dropdown",
          "line": 4,
          "example": "dropdown"
        },
        {
          "pattern": "scroll",
          "line": 68,
          "example": "scroll"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/ui/input.tsx",
      "refs": [
        "campos"
      ],
      "exclusion": null,
      "sha256": "92debb7d6d2d96d9e607a42d5ce8f37b2d63384ae5dd9ffbbf5f047b680ffb85",
      "evidence": [
        {
          "pattern": "campos",
          "line": 8,
          "example": "campos"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/ui/label.tsx",
      "refs": [
        "campos"
      ],
      "exclusion": null,
      "sha256": "969f8597a2b03f89461728c6e271fd3b6c0d3e781c2e615552e73b0db3d0a2cc",
      "evidence": []
    },
    {
      "project": "Centinela web",
      "file": "components/ui/popover.tsx",
      "refs": [
        "ayudas"
      ],
      "exclusion": null,
      "sha256": "58a9bdb2df741017873805e7e5b218eb6106d0af2e4215cfc265e098442da96d",
      "evidence": [
        {
          "pattern": "popover",
          "line": 4,
          "example": "ayudas"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/ui/textarea.tsx",
      "refs": [
        "textarea"
      ],
      "exclusion": null,
      "sha256": "8dcc1378c319a9fa37a2563a47e328c6dce7a582ee7d07a906ad4318b4436b85",
      "evidence": [
        {
          "pattern": "texto extenso",
          "line": 10,
          "example": "textarea"
        }
      ]
    },
    {
      "project": "Centinela web",
      "file": "components/update-password-form.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "440dbc55f1a79e1c05cf2d0e2b600ab5e7b703d83538dddd322a5951e9c0669f",
      "evidence": [
        {
          "pattern": "botones",
          "line": 113,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 104,
          "example": "campos"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "App.tsx",
      "refs": [
        "accesos",
        "actualizacion",
        "alerta-guardia",
        "carga",
        "gps",
        "listas",
        "menu-movil",
        "modal",
        "offline",
        "permisos",
        "scroll",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "a797884b536995059ed0248db261496c0d3218cf9e7563a02040835486e12c5d",
      "evidence": [
        {
          "pattern": "botones",
          "line": 158,
          "example": "variantes-boton"
        },
        {
          "pattern": "modal",
          "line": 169,
          "example": "modal"
        },
        {
          "pattern": "scroll",
          "line": 9,
          "example": "scroll"
        },
        {
          "pattern": "carga",
          "line": 7,
          "example": "carga"
        },
        {
          "pattern": "sin conexión",
          "line": 40,
          "example": "offline"
        },
        {
          "pattern": "ubicación",
          "line": 36,
          "example": "gps"
        },
        {
          "pattern": "tarjetas",
          "line": 157,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "components/GuardiaAppAlertModal.tsx",
      "refs": [
        "alerta-guardia",
        "carga",
        "error",
        "listas",
        "modal",
        "multiseleccion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "41b971f3fb77bd3cf24d4371e862903a3c4bf6ee8d55bc67d4c0beba6ef73cb3",
      "evidence": [
        {
          "pattern": "botones",
          "line": 65,
          "example": "variantes-boton"
        },
        {
          "pattern": "modal",
          "line": 35,
          "example": "modal"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        },
        {
          "pattern": "errores",
          "line": 63,
          "example": "error"
        },
        {
          "pattern": "tarjetas",
          "line": 37,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "components/LoadingDots.tsx",
      "refs": [
        "carga"
      ],
      "exclusion": null,
      "sha256": "e6ff57d29af71b612160c5f3f14bed203165a9a94a28ee2332f057d107b4b699",
      "evidence": [
        {
          "pattern": "carga",
          "line": 4,
          "example": "carga"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "components/UpdateModal.tsx",
      "refs": [
        "actualizacion",
        "carga",
        "modal",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "8c753cfe491d628b2397aff56cec23a2bbfbfea6df85e0406fbbeebbe4fa160a",
      "evidence": [
        {
          "pattern": "botones",
          "line": 83,
          "example": "variantes-boton"
        },
        {
          "pattern": "modal",
          "line": 60,
          "example": "modal"
        },
        {
          "pattern": "carga",
          "line": 8,
          "example": "carga"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/AdminAccesosScreen.tsx",
      "refs": [
        "accesos",
        "campos",
        "carga",
        "listas",
        "modal",
        "scroll",
        "teclado",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "ac2864e77f64201ebd2324e0f527ce4706d8148f70f980e594290798ae2f6052",
      "evidence": [
        {
          "pattern": "botones",
          "line": 201,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 217,
          "example": "campos"
        },
        {
          "pattern": "modal",
          "line": 315,
          "example": "modal"
        },
        {
          "pattern": "scroll",
          "line": 8,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 7,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        },
        {
          "pattern": "tarjetas",
          "line": 265,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/AdminDevicesScreen.tsx",
      "refs": [
        "carga",
        "gps",
        "listas",
        "mapas",
        "modal",
        "scroll",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "4a7b4d1377771bdf2c5767f5edb7dce0dc5f54b7b743f87330f7ec6c522778d9",
      "evidence": [
        {
          "pattern": "botones",
          "line": 136,
          "example": "variantes-boton"
        },
        {
          "pattern": "modal",
          "line": 285,
          "example": "modal"
        },
        {
          "pattern": "mapa",
          "line": 15,
          "example": "mapas"
        },
        {
          "pattern": "scroll",
          "line": 7,
          "example": "scroll"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        },
        {
          "pattern": "ubicación",
          "line": 32,
          "example": "gps"
        },
        {
          "pattern": "tarjetas",
          "line": 138,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/AdminGuardiaAlertsScreen.tsx",
      "refs": [
        "alerta-guardia",
        "campos",
        "carga",
        "modal",
        "multiseleccion",
        "scroll",
        "teclado",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "450b4b2cb96d1b18b74a75dcf11089be33923a77d7919a3700441d7a55b4f786",
      "evidence": [
        {
          "pattern": "botones",
          "line": 175,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 199,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 215,
          "example": "textarea"
        },
        {
          "pattern": "modal",
          "line": 341,
          "example": "modal"
        },
        {
          "pattern": "scroll",
          "line": 8,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 7,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/AdminNovedadesScreen.tsx",
      "refs": [
        "calendario",
        "campos",
        "carga",
        "evidencias",
        "gps",
        "listas",
        "mapas",
        "modal",
        "scroll",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "39a9c3d52a2f3831fd49188c0b03af5a4674797762036601fb1b0fc4bf7e1333",
      "evidence": [
        {
          "pattern": "botones",
          "line": 332,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 419,
          "example": "campos"
        },
        {
          "pattern": "calendario",
          "line": 21,
          "example": "calendario"
        },
        {
          "pattern": "listado",
          "line": 485,
          "example": "listas"
        },
        {
          "pattern": "modal",
          "line": 583,
          "example": "modal"
        },
        {
          "pattern": "mapa",
          "line": 20,
          "example": "mapas"
        },
        {
          "pattern": "evidencias",
          "line": 35,
          "example": "evidencias"
        },
        {
          "pattern": "scroll",
          "line": 11,
          "example": "scroll"
        },
        {
          "pattern": "carga",
          "line": 9,
          "example": "carga"
        },
        {
          "pattern": "ubicación",
          "line": 55,
          "example": "gps"
        },
        {
          "pattern": "tarjetas",
          "line": 373,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/AdminRecorridasScreen.tsx",
      "refs": [
        "campos",
        "carga",
        "error",
        "listas",
        "mapas",
        "recorridas",
        "scroll",
        "teclado",
        "timeline",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "98a9c3807269665a3f769f1525b76b605b99582798613649a587ac8c54e1afb7",
      "evidence": [
        {
          "pattern": "botones",
          "line": 330,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 406,
          "example": "campos"
        },
        {
          "pattern": "listado",
          "line": 436,
          "example": "listas"
        },
        {
          "pattern": "mapa",
          "line": 14,
          "example": "mapas"
        },
        {
          "pattern": "scroll",
          "line": 12,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 5,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        },
        {
          "pattern": "errores",
          "line": 434,
          "example": "error"
        },
        {
          "pattern": "tarjetas",
          "line": 329,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/GuardiaAccesosScreen.tsx",
      "refs": [
        "accesos",
        "campos",
        "carga",
        "listas",
        "scroll",
        "teclado",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "722e711f6b8ee5305a3cd1727de7e38b3675906e92f026752019527c160b91ec",
      "evidence": [
        {
          "pattern": "botones",
          "line": 180,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 217,
          "example": "campos"
        },
        {
          "pattern": "scroll",
          "line": 7,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 6,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        },
        {
          "pattern": "tarjetas",
          "line": 250,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/GuardiaCheckInScreen.tsx",
      "refs": [
        "accesos",
        "campos",
        "carga",
        "listas",
        "scroll",
        "selectores",
        "teclado",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "0a4769cafb715949c24540226e06626bc6b1a3deb4200c74c7573faa944f0048",
      "evidence": [
        {
          "pattern": "botones",
          "line": 132,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 177,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 255,
          "example": "textarea"
        },
        {
          "pattern": "selector",
          "line": 146,
          "example": "selectores"
        },
        {
          "pattern": "scroll",
          "line": 6,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 5,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        },
        {
          "pattern": "tarjetas",
          "line": 143,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/GuardiaNovedadForm.tsx",
      "refs": [
        "camara-qr",
        "campos",
        "carga",
        "evidencias",
        "formulario-completo",
        "gps",
        "modal",
        "offline",
        "scroll",
        "selectores",
        "teclado",
        "textarea",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "7bf23bddd5732fa41556d34dff3c20a7e63ca7af3aa26570c9a8574b00dc44a1",
      "evidence": [
        {
          "pattern": "botones",
          "line": 1396,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 1409,
          "example": "campos"
        },
        {
          "pattern": "texto extenso",
          "line": 1410,
          "example": "textarea"
        },
        {
          "pattern": "selector",
          "line": 1352,
          "example": "selectores"
        },
        {
          "pattern": "modal",
          "line": 1517,
          "example": "modal"
        },
        {
          "pattern": "cámara/QR",
          "line": 19,
          "example": "camara-qr"
        },
        {
          "pattern": "evidencias",
          "line": 18,
          "example": "evidencias"
        },
        {
          "pattern": "scroll",
          "line": 6,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 3,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 11,
          "example": "carga"
        },
        {
          "pattern": "sin conexión",
          "line": 26,
          "example": "offline"
        },
        {
          "pattern": "ubicación",
          "line": 22,
          "example": "gps"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/GuardiaRecorridasHistoryScreen.tsx",
      "refs": [
        "carga",
        "error",
        "listas",
        "mapas",
        "recorridas",
        "scroll",
        "teclado",
        "timeline",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "b078dca4e5fc81b27e83f45363cc265e485357061773cea386ee9f41d6dd3496",
      "evidence": [
        {
          "pattern": "botones",
          "line": 284,
          "example": "variantes-boton"
        },
        {
          "pattern": "mapa",
          "line": 11,
          "example": "mapas"
        },
        {
          "pattern": "scroll",
          "line": 5,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 4,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        },
        {
          "pattern": "errores",
          "line": 357,
          "example": "error"
        },
        {
          "pattern": "tarjetas",
          "line": 283,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/LoginScreen.tsx",
      "refs": [
        "acceso-web",
        "campos",
        "carga",
        "listas",
        "scroll",
        "seleccion",
        "teclado",
        "validacion",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "57e7e7ea8a340b7f4d8e961e896333771994f3beb70661aecdda07ab27c7a50f",
      "evidence": [
        {
          "pattern": "botones",
          "line": 154,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 115,
          "example": "campos"
        },
        {
          "pattern": "selección",
          "line": 145,
          "example": "seleccion"
        },
        {
          "pattern": "scroll",
          "line": 11,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 3,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 14,
          "example": "carga"
        },
        {
          "pattern": "tarjetas",
          "line": 107,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/MisNovedadesScreen.tsx",
      "refs": [
        "campos",
        "carga",
        "error",
        "evidencias",
        "listas",
        "modal",
        "offline",
        "teclado",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "0f6a702ebda4c1f30fe4f42c8c96a9d684297468a7c5d18742c497032bb6e897",
      "evidence": [
        {
          "pattern": "botones",
          "line": 180,
          "example": "variantes-boton"
        },
        {
          "pattern": "campos",
          "line": 457,
          "example": "campos"
        },
        {
          "pattern": "listado",
          "line": 471,
          "example": "listas"
        },
        {
          "pattern": "modal",
          "line": 688,
          "example": "modal"
        },
        {
          "pattern": "evidencias",
          "line": 24,
          "example": "evidencias"
        },
        {
          "pattern": "área segura",
          "line": 14,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        },
        {
          "pattern": "errores",
          "line": 436,
          "example": "error"
        },
        {
          "pattern": "sin conexión",
          "line": 25,
          "example": "offline"
        },
        {
          "pattern": "tarjetas",
          "line": 516,
          "example": "listas"
        }
      ]
    },
    {
      "project": "Centinela Android",
      "file": "screens/RecorridasScreen.tsx",
      "refs": [
        "carga",
        "error",
        "gps",
        "listas",
        "mapas",
        "recorridas",
        "scroll",
        "teclado",
        "timeline",
        "variantes-boton"
      ],
      "exclusion": null,
      "sha256": "cc3ecf874db9b2c2be6c561e39e804183975376fc1d06306b9d330bde8c7e596",
      "evidence": [
        {
          "pattern": "botones",
          "line": 1043,
          "example": "variantes-boton"
        },
        {
          "pattern": "scroll",
          "line": 6,
          "example": "scroll"
        },
        {
          "pattern": "área segura",
          "line": 5,
          "example": "teclado"
        },
        {
          "pattern": "carga",
          "line": 3,
          "example": "carga"
        },
        {
          "pattern": "errores",
          "line": 1073,
          "example": "error"
        },
        {
          "pattern": "ubicación",
          "line": 14,
          "example": "gps"
        },
        {
          "pattern": "tarjetas",
          "line": 1138,
          "example": "listas"
        }
      ]
    }
  ]
};
