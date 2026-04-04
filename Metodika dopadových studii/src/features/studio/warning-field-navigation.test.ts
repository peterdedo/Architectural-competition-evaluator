import { describe, expect, it } from "vitest";

import { resolveWarningFieldNavigation } from "./warning-field-navigation";



describe("resolveWarningFieldNavigation", () => {

  it("maps employment and housing fields", () => {

    expect(resolveWarningFieldNavigation("M_region", "baseline")).toEqual({

      step: 4,

      elementId: "mRegion",

    });

    expect(resolveWarningFieldNavigation("NP_total", "optimistic")).toEqual({

      step: 4,

      elementId: "npTotal",

    });

    expect(resolveWarningFieldNavigation("occ_by_type.byt", "baseline")).toEqual({

      step: 5,

      elementId: "occByt",

    });

  });



  it("uses active scenario for scénářové symboly", () => {

    expect(resolveWarningFieldNavigation("theta", "pessimistic")).toEqual({

      step: 3,

      elementId: "scenario-pessimistic-theta",

    });

  });



  it("maps shared assumption symbols to step 9", () => {

    expect(resolveWarningFieldNavigation("KH", "baseline")).toEqual({

      step: 9,

      elementId: "shared-assumption-KH",

    });

  });



  it("returns null for unknown fields", () => {

    expect(resolveWarningFieldNavigation("totally_unknown_field_xyz", "baseline")).toBeNull();

  });

});


