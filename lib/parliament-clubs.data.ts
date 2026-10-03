// Generuje scripts/build-deputies.mjs z public/data/hlasovania (kluby k poslednému hlasovaniu). Needitovať ručne.
export const parliamentClubs = {
  "asOf": "2026-10-01",
  "voteId": 58399,
  "votes": 348,
  "deputies": 169,
  "since": "2023-11-22",
  "clubs": [
    {
      "club": "Klub SMER - SD",
      "party": "smer",
      "seats": 41
    },
    {
      "club": "Klub HLAS - SD",
      "party": "hlas",
      "seats": 25
    },
    {
      "club": "Klub SNS",
      "party": "sns",
      "seats": 8
    },
    {
      "club": "Poslanci, ktorí nie sú členmi poslaneckých klubov",
      "party": "nezaradeni",
      "seats": 8
    },
    {
      "club": "Klub SLOVENSKO - ZA ĽUDÍ",
      "party": "slovensko",
      "seats": 12
    },
    {
      "club": "Klub PS",
      "party": "ps",
      "seats": 33
    },
    {
      "club": "Klub KDH",
      "party": "kdh",
      "seats": 12
    },
    {
      "club": "Klub SaS",
      "party": "sas",
      "seats": 11
    }
  ]
} as const;
