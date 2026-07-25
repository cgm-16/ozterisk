# Release Checklist and Definition of Done

### 8.6 Release acceptance

- [ ] GitHub milestones and labels exist.
- [ ] Every implementation issue includes metadata and dependency IDs.
- [ ] CI is required and green.
- [ ] Exact release commit is deployed.
- [ ] Production URL opens title screen.
- [ ] Shared result includes normal production URL only.
- [ ] Refresh resets run and retains language only.
- [ ] Production gameplay requires no runtime backend call.
- [ ] README matches the shipped behavior.

## 9. Definition of Done

The PoC is complete only when:

1. all tasks T01–T14 are merged in dependency order;
2. every requirement in the traceability matrix has recorded evidence;
3. all master checklists are checked;
4. CI passes on the exact production commit;
5. a production Vercel deployment passes the smoke checklist;
6. the deployed game is fully playable in English and Korean with mouse, touch, and keyboard;
7. no out-of-scope feature or service has been introduced.
