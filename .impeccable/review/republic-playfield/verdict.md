## verdict

1. Resolved—desktop.png now shows a 230px expanded rail with normal-length headings, instructions and task buttons; landscape.png shows its 190px rail. CSS media selectors apply only with data-rail, while mobile-map.png retains the 48px collapsed rail. All required recaptures remain valid.
2. Resolved—mobile-after-parcel.png shows the parcel dialog dismissed, expanded plan still present and the parcel button visibly focused. The originating-event/default-prevented guards and ancestor-dialog guard are present in source; the parent browser check confirms a subsequent Escape closes the plan and restores the normal entry focus and document overflow.

## remaining

Clear. No regressions from this fix batch are visible in the required recaptures. Ship covers the scored fixes, not the whole surface.

disposition: ship
