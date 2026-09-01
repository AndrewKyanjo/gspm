# Monthly contributions review

Corrected review generated from the connected Supabase source records on 24 August 2026. No production records were changed while generating this document. The normalization migration is `supabase/migrations/20260824_standardize_contribution_obligations.sql`.

## Corrected executive summary

- Standard 2026 obligation: **UGX 58,650,000** across **75 parishes**.
- Cash recorded: **UGX 15,230,000**.
- Cash applied to Emitemwa and Good Samaritan Day: **UGX 14,310,000**.
- Outstanding: **UGX 44,340,000**.
- Explicit parish surplus: **UGX 920,000**.
- Status: **7 cleared**, **36 partial**, **32 unpaid**.
- Source inconsistencies corrected: **8 legacy rows** whose imported paid-plus-balance did not equal the standard annual rate.

## Authoritative calculation model

1. Effective monthly rate = parish override when present, otherwise vicariate rate. The current data has no parish overrides.
2. Annual Emitemwa due = effective monthly rate × 12. Therefore the only current annual targets are UGX 600,000 or UGX 360,000.
3. Imported legacy paid amounts are payment history, not an obligation definition. Imported balance values are retained for audit but replaced by `standard due − amount applied`.
4. Money is applied in order: Emitemwa, then Good Samaritan Day, then parish surplus.
5. A parish surplus remains attached to that parish. It must not reduce another parish’s balance unless an authorized transfer/redistribution record identifies the source parish, destination parish, amount, reason, approver, and date.

## Corrected legacy inconsistencies

| Parish | Monthly rate | Imported paid | Imported balance | Imported target | Standard annual due | Corrected Emitemwa balance | Resolution |
|---|---:|---:|---:|---:|---:|---:|---|
| Buloba Parish | UGX 50,000 | UGX 240,000 | UGX 520,000 | UGX 760,000 | UGX 600,000 | UGX 240,000 | Target reset to UGX 600,000 |
| Bweyogerere Parish | UGX 50,000 | UGX 0 | UGX 100,000 | UGX 100,000 | UGX 600,000 | UGX 600,000 | Target reset to UGX 600,000 |
| Kiziba Parish | UGX 50,000 | UGX 150,000 | UGX 210,000 | UGX 360,000 | UGX 600,000 | UGX 450,000 | Target reset to UGX 600,000 |
| Lubaga Parish | UGX 50,000 | UGX 1,720,000 | UGX 0 | UGX 1,720,000 | UGX 600,000 | UGX 0 | All obligations cleared; UGX 920,000 surplus |
| Migadde Parish | UGX 50,000 | UGX 0 | UGX 360,000 | UGX 360,000 | UGX 600,000 | UGX 600,000 | Target reset to UGX 600,000 |
| Mpala Parish | UGX 50,000 | UGX 0 | UGX 300,000 | UGX 300,000 | UGX 600,000 | UGX 600,000 | Target reset to UGX 600,000 |
| Namayumba Parish | UGX 50,000 | UGX 30,000 | UGX 330,000 | UGX 360,000 | UGX 600,000 | UGX 570,000 | Target reset to UGX 600,000 |
| Nkozi Parish | UGX 30,000 | UGX 0 | UGX 600,000 | UGX 600,000 | UGX 360,000 | UGX 360,000 | Target reset to UGX 360,000 |

## Lubaga Parish resolution

Lubaga has UGX 1,770,000 recorded. The professional allocation is UGX 600,000 to annual Emitemwa, UGX 250,000 to Good Samaritan Day, and UGX 920,000 retained as Lubaga Parish surplus. Lubaga is therefore **fully cleared**. Its surplus is not silently shared with other parishes; any sharing must be represented by auditable transfer records.

## Vicariate summary

| Vicariate | Parishes | Due | Recorded | Applied | Outstanding | Surplus | Cleared |
|---|---:|---:|---:|---:|---:|---:|---:|
| Entebbe Vicariate | 16 | UGX 13,600,000 | UGX 2,185,000 | UGX 2,185,000 | UGX 11,415,000 | UGX 0 | 0 |
| Kampala Vicariate | 26 | UGX 22,100,000 | UGX 6,900,000 | UGX 5,980,000 | UGX 16,120,000 | UGX 920,000 | 4 |
| Mitala Maria Vicariate | 15 | UGX 7,650,000 | UGX 1,165,000 | UGX 1,165,000 | UGX 6,485,000 | UGX 0 | 0 |
| Wakiso Vicariate | 18 | UGX 15,300,000 | UGX 4,980,000 | UGX 4,980,000 | UGX 10,320,000 | UGX 0 | 3 |
| **Total** | **75** | **UGX 58,650,000** | **UGX 15,230,000** | **UGX 14,310,000** | **UGX 44,340,000** | **UGX 920,000** | **7** |

## Corrected parish ledger

| Parish | Deanery | Vicariate | Monthly rate | Annual Emitemwa due | Total recorded | Emitemwa applied | Emitemwa balance | GSD due | GSD applied | GSD balance | Surplus | Status |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Bbiina Parish | Naggulu Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 300,000 | UGX 300,000 | UGX 300,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Bbuto Parish | Ggayaaza Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Bugongo Parish | Entebbe Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Bujuuko Parish | Mpigi Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 0 | UGX 0 | UGX 360,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Unpaid |
| Bulo Parish | Mitala Maria Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 0 | UGX 0 | UGX 360,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Unpaid |
| Buloba Parish | Nabbingo Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 360,000 | UGX 360,000 | UGX 240,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Bunnamwaya Parish | Nabbingo Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 250,000 | UGX 250,000 | UGX 350,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Busega Parish | Lubaga Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 200,000 | UGX 200,000 | UGX 400,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Buyege Parish | Entebbe Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Bwayiise Parish | Nakulabye Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Bweyogerere Parish | Ggayaaza Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Christ the King | Christ the King Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Ggaba Parish | Nsambya Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 600,000 | UGX 600,000 | UGX 0 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Ggayaaza Parish | Ggayaaza Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 300,000 | UGX 300,000 | UGX 300,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Ggoli Parish | Mpigi Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 30,000 | UGX 30,000 | UGX 330,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Partial |
| Ggombe Parish | Mitala Maria Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 125,000 | UGX 125,000 | UGX 235,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Partial |
| Jjanya Parish | Mpigi Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 200,000 | UGX 200,000 | UGX 160,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Partial |
| Jjinja-Kalooli Parish | Matugga Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 600,000 | UGX 600,000 | UGX 0 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Kabulamuliro Parish | Entebbe Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Kamuli Parish | Ggayaaza Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 100,000 | UGX 100,000 | UGX 500,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Kamwokya Parish | Christ the King Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 300,000 | UGX 300,000 | UGX 300,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Kankobe Parish | Mitala Maria Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 30,000 | UGX 30,000 | UGX 330,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Partial |
| Kansanga Parish | Nsambya Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Kanyanya Parish | Nakulabye Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Kasenge Parish | Nabbingo Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 150,000 | UGX 150,000 | UGX 450,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Katende Parish | Mpigi Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 360,000 | UGX 360,000 | UGX 0 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Partial |
| Kawanda Parish | Matugga Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Kibanga Parish | Mpigi Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 0 | UGX 0 | UGX 360,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Unpaid |
| Kibibi Parish | Mitala Maria Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 70,000 | UGX 70,000 | UGX 290,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Partial |
| Kibiri Parish | Kibiri Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Kibuye-Makindye Parish | Nsambya Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Kigoowa Parish | Christ the King Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 200,000 | UGX 200,000 | UGX 400,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Kireka Parish | Ggayaaza Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Kisubi Parish | Entebbe Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Kitagobwa Parish | Matugga Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 150,000 | UGX 150,000 | UGX 450,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Kitakyusa Parish | Mitala Maria Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 90,000 | UGX 90,000 | UGX 270,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Partial |
| Kiwatule Parish | Naggulu Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 850,000 | UGX 600,000 | UGX 0 | UGX 250,000 | UGX 250,000 | UGX 0 | UGX 0 | Cleared |
| Kiziba Parish | Naddangira Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 150,000 | UGX 150,000 | UGX 450,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Kkonge-Lukuli Parish | Nsambya Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 850,000 | UGX 600,000 | UGX 0 | UGX 250,000 | UGX 250,000 | UGX 0 | UGX 0 | Cleared |
| Kkonge-Mpigi | Mpigi Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 80,000 | UGX 80,000 | UGX 280,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Partial |
| Kyengera Parish | Nabbingo Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 600,000 | UGX 600,000 | UGX 0 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Lubaga Parish | Lubaga Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 1,770,000 | UGX 600,000 | UGX 0 | UGX 250,000 | UGX 250,000 | UGX 0 | UGX 920,000 | Cleared |
| Lweza Parish | Kibiri Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 175,000 | UGX 175,000 | UGX 425,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Mapeera-Nabulagala | Nakulabye Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Masajja Parish | Kibiri Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Matugga Parish | Matugga Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 350,000 | UGX 350,000 | UGX 250,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Mbuya Parish | Naggulu Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Migadde Parish | Matugga Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Mitala Maria Parish | Mitala Maria Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 0 | UGX 0 | UGX 360,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Unpaid |
| Mmengo-Kisenyi | Christ the King Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Mpala Parish | Entebbe Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Mpigi Parish | Mpigi Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 180,000 | UGX 180,000 | UGX 180,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Partial |
| Muduuma Parish | Mpigi Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 0 | UGX 0 | UGX 360,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Unpaid |
| Mulago Parish | Nakulabye Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 210,000 | UGX 210,000 | UGX 390,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Munyonyo Parish | Nsambya Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Mutundwe Parish | Lubaga Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Mwereerwe Parish | Matugga Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 250,000 | UGX 250,000 | UGX 350,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Nabbingo Parish | Nabbingo Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 200,000 | UGX 200,000 | UGX 400,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Nabitalo Parish | Ggayaaza Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 300,000 | UGX 300,000 | UGX 300,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Naddangira Parish | Naddangira Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 200,000 | UGX 200,000 | UGX 400,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Naggulu Parish | Naggulu Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Nakawuka Parish | Nabbingo Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Nakulabye Parish | Nakulabye Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 270,000 | UGX 270,000 | UGX 330,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Namasuba Parish | Kibiri Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 300,000 | UGX 300,000 | UGX 300,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Namayumba Parish | Naddangira Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 30,000 | UGX 30,000 | UGX 570,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Namugongo Parish | Ggayaaza Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 850,000 | UGX 600,000 | UGX 0 | UGX 250,000 | UGX 250,000 | UGX 0 | UGX 0 | Cleared |
| Nansana Parish | Naddangira Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 850,000 | UGX 600,000 | UGX 0 | UGX 250,000 | UGX 250,000 | UGX 0 | UGX 0 | Cleared |
| Ndeeba Parish | Lubaga Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Ndejje Parish | Kibiri Deanery | Entebbe Vicariate | UGX 50,000 | UGX 600,000 | UGX 150,000 | UGX 150,000 | UGX 450,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Nkozi Parish | Mitala Maria Deanery | Mitala Maria Vicariate | UGX 30,000 | UGX 360,000 | UGX 0 | UGX 0 | UGX 360,000 | UGX 150,000 | UGX 0 | UGX 150,000 | UGX 0 | Unpaid |
| Nsambya Parish | Nsambya Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 300,000 | UGX 300,000 | UGX 300,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Ntinda Parish | Naggulu Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 850,000 | UGX 600,000 | UGX 0 | UGX 250,000 | UGX 250,000 | UGX 0 | UGX 0 | Cleared |
| Old Kampala Parish | Christ the King Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 0 | UGX 0 | UGX 600,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Unpaid |
| Salaama Parish | Nsambya Deanery | Kampala Vicariate | UGX 50,000 | UGX 600,000 | UGX 200,000 | UGX 200,000 | UGX 400,000 | UGX 250,000 | UGX 0 | UGX 250,000 | UGX 0 | Partial |
| Wakiso Parish | Naddangira Deanery | Wakiso Vicariate | UGX 50,000 | UGX 600,000 | UGX 850,000 | UGX 600,000 | UGX 0 | UGX 250,000 | UGX 250,000 | UGX 0 | UGX 0 | Cleared |

## Professional data-handling recommendations

1. **Keep obligations, payments, allocations, and credits separate.** Rates define obligations; payment rows record cash; allocation logic applies cash; surplus remains a credit. Never infer the target from an imported balance.
2. **Preserve source evidence.** The migration stores original imported paid and balance values in `source_paid_amount` and `source_balance_amount` before normalization.
3. **Enforce one opening snapshot per parish/year.** A unique parish/year index prevents duplicate imports from doubling balances.
4. **Normalize at the database boundary.** The migration trigger converts future legacy imports to the standard annual obligation automatically while preserving their source values.
5. **Use explicit transfers for shared surplus.** If leadership intentionally shares Lubaga’s credit, create a transfer ledger rather than changing other parishes’ paid values. The transfer should be double-entry so total credits cannot increase accidentally.
6. **Keep corrections auditable.** Do not delete financial history silently. Record who corrected a payment, the old and new values, the reason, and the timestamp.
7. **Regenerate reproducible reports after rule changes.** The migration removes only unpublished 2026 generated snapshots calculated under the old rules; published reports should instead receive a versioned correction note.
8. **Use precise labels.** The UI now distinguishes total recorded cash, amount applied, outstanding balance, and surplus instead of presenting overpayments as ordinary YTD paid.

## Migration run order

1. Back up `contribution_legacy_opening_balances`, `emitemwa_payments`, and `generated_monthly_reports`.
2. Apply `20260824_standardize_contribution_obligations.sql`.
3. Deploy the application calculation changes.
4. Regenerate the August 2026 monthly report and reconcile the totals in this document.
5. If any surplus is redistributed, enter it through a dedicated transfer workflow; do not edit parish payment totals directly.
