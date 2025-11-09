/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/meblog.json`.
 */
export type Meblog = {
  "address": "5Egs87GhS4BoSoBhMgw9p23zpEyfBec6UcsVKsmQioEX",
  "metadata": {
    "name": "meblog",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createBlog",
      "discriminator": [
        221,
        118,
        241,
        5,
        53,
        181,
        90,
        253
      ],
      "accounts": [
        {
          "name": "blogAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  108,
                  111,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "title"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "content",
          "type": "string"
        },
        {
          "name": "isPrivate",
          "type": "bool"
        }
      ]
    },
    {
      "name": "deleteBlog",
      "discriminator": [
        110,
        242,
        46,
        158,
        112,
        4,
        189,
        122
      ],
      "accounts": [
        {
          "name": "blogAccount",
          "writable": true
        },
        {
          "name": "creator",
          "signer": true,
          "relations": [
            "blogAccount"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "likeBlog",
      "discriminator": [
        135,
        108,
        212,
        205,
        27,
        188,
        171,
        54
      ],
      "accounts": [
        {
          "name": "blogAccount",
          "writable": true
        },
        {
          "name": "likeAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "blogAccount"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "saveBlog",
      "discriminator": [
        48,
        101,
        189,
        236,
        180,
        65,
        116,
        237
      ],
      "accounts": [
        {
          "name": "blogAccount"
        },
        {
          "name": "savedAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  97,
                  118,
                  101,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "blogAccount"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "blogState",
      "discriminator": [
        244,
        86,
        195,
        29,
        196,
        144,
        214,
        46
      ]
    },
    {
      "name": "likeState",
      "discriminator": [
        168,
        216,
        170,
        133,
        80,
        166,
        248,
        98
      ]
    },
    {
      "name": "savedState",
      "discriminator": [
        173,
        204,
        95,
        156,
        32,
        181,
        172,
        239
      ]
    }
  ],
  "events": [
    {
      "name": "blogEvent",
      "discriminator": [
        42,
        72,
        114,
        226,
        64,
        102,
        81,
        206
      ]
    },
    {
      "name": "likeEvent",
      "discriminator": [
        134,
        155,
        94,
        165,
        4,
        38,
        255,
        145
      ]
    },
    {
      "name": "saveEvent",
      "discriminator": [
        225,
        146,
        7,
        52,
        168,
        122,
        31,
        92
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "privateBlogNotLikeable",
      "msg": "Cannot like or unlike private blogs"
    },
    {
      "code": 6001,
      "name": "cannotLikeOwnBlog",
      "msg": "Cannot like your own blog"
    },
    {
      "code": 6002,
      "name": "titleTooLong",
      "msg": "Title exceeds maximum allowed length (100 characters)"
    },
    {
      "code": 6003,
      "name": "contentEmpty",
      "msg": "Content cannot be empty"
    },
    {
      "code": 6004,
      "name": "contentTooLong",
      "msg": "Content exceeds maximum allowed length (1000 characters)"
    }
  ],
  "types": [
    {
      "name": "blogEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "label",
            "type": "string"
          },
          {
            "name": "blogId",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "isPrivate",
            "type": "bool"
          },
          {
            "name": "title",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "blogState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "isPrivate",
            "type": "bool"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "likeCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "content",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "likeEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "blogId",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "action",
            "type": "string"
          },
          {
            "name": "likeCount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "likeState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "blog",
            "type": "pubkey"
          },
          {
            "name": "isLiked",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "saveEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "blogId",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "action",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "savedState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "blog",
            "type": "pubkey"
          },
          {
            "name": "savedAt",
            "type": "i64"
          },
          {
            "name": "isSaved",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
