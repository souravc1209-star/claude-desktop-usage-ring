# Roadmap

The first release includes the offline demo, a configurable widget and local example, tests, and a documented Windows proof of concept. For actual support boundaries, see the [compatibility review](review.md).

## Next improvements

- Exercise the panel with NVDA and VoiceOver and document status announcements and keyboard behavior on physical devices.
- Move visual comparisons to a fixed browser and font environment if design changes become frequent. The current suite checks geometry and exports representative captures.
- Expand integration examples only when a use case demonstrates demand for a documented data adapter or quota category.

## Standalone value

| Rank | Opportunity | Usefulness and cost |
| --- | --- | --- |
| 1 | Reusable widget | Configurable categories, thresholds, and a provider interface let other projects reuse this code. The adapter examples remain local and add no runtime dependency. |
| 2 | Engineering resource | The lifecycle and cancellation tests complement a case study on Windows window discovery, focus, keyboard input, and debugging. Maintenance follows the existing code and tests. |
| 3 | More integration examples | A few authorized use cases could demonstrate versatility. Each example adds upkeep and should avoid encouraging readers to ship client-side credentials. |
| 4 | Generic dashboard | Could serve a wider quota-management use case. It adds more interaction and maintenance, so it remains a separate possibility. |

Public live integration would require a suitable documented or explicitly authorized Claude interface. Until one exists, the portfolio demo and examples use local or synthetic data.

## Discoverability

Share the demo, the engineering case study, or a versioned release in contexts where the project answers a specific question. For example, the case study can accompany an explanation of Windows focus or DOM reattachment. The public counters describe repository activity and do not measure technical quality.
