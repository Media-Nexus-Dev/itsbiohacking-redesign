/**
 * Peptide Calculator — WordPress Plugin JS
 * Plugin: peptide-calculator
 * Shortcode: [peptide_calculator]
 *
 * Uses IIFE to avoid polluting global scope.
 * Safe to run multiple times on the same page.
 */
(function () {
    'use strict';

    function initPeptideCalculator() {
        // Support multiple instances on one page
        document.querySelectorAll('.peptide-calc-container[data-pc-init]').forEach(function (container) {
            if (container._pcInitialized) return;
            container._pcInitialized = true;
            setupCalculator(container);
        });
    }

    function setupCalculator(root) {
        var state = {
            syringeVolume: null,    syringeVolumeCustom: false,
            peptideAmount: null,    peptideUnit: 'mg',  peptideAmountCustom: false,
            waterVolume: null,      waterVolumeCustom: false,
            desiredDose: null,      desiredDoseUnit: 'mg', desiredDoseCustom: false,
            concDisplayUnit: 'mg'
        };

        var presets = {
            peptide: {
                mg:  [{value:5,label:'5 mg'},{value:10,label:'10 mg'},{value:15,label:'15 mg'},{value:30,label:'30 mg'}],
                mcg: [{value:5000,label:'5000 mcg'},{value:10000,label:'10000 mcg'},{value:15000,label:'15000 mcg'},{value:30000,label:'30000 mcg'}]
            },
            dose: {
                mg:  [{value:0.25,label:'0.25 mg'},{value:0.5,label:'0.5 mg'},{value:1,label:'1 mg'},{value:2,label:'2 mg'},{value:2.5,label:'2.5 mg'},{value:5,label:'5 mg'}],
                mcg: [{value:250,label:'250 mcg'},{value:500,label:'500 mcg'},{value:1000,label:'1000 mcg'},{value:2000,label:'2000 mcg'},{value:2500,label:'2500 mcg'},{value:5000,label:'5000 mcg'}]
            }
        };

        function q(sel)  { return root.querySelector(sel); }
        function qa(sel) { return root.querySelectorAll(sel); }

        var els = {
            syringeVolumeInput: q('#pc-syringeVolumeInput'),
            peptideAmountInput: q('#pc-peptideAmountInput'),
            waterVolumeInput:   q('#pc-waterVolumeInput'),
            desiredDoseInput:   q('#pc-desiredDoseInput'),
            peptideCustomUnit:  q('#pc-peptideCustomUnit'),
            doseCustomUnit:     q('#pc-doseCustomUnit'),
            peptideConversion:  q('#pc-peptideConversion'),
            doseConversion:     q('#pc-doseConversion'),
            errorMessage:       q('#pc-errorMessage'),
            errorText:          q('#pc-errorText'),
            resetBtn:           q('#pc-resetBtn'),
            syringeContainer:   q('#pc-syringeContainer'),
            syringeScaleText:   q('#pc-syringeScaleText'),
            concentration:      q('#pc-concentration'),
            injectionVolume:    q('#pc-injectionVolume'),
            totalDoses:         q('#pc-totalDoses'),
            syringeUnitsResult: q('#pc-syringeUnitsResult'),
            syringeDisplay:     q('#pc-syringeDisplay'),
            syringeTypeLabel:   q('#pc-syringeTypeLabel'),
            concUnitToggle:     q('#pc-concUnitToggle')
        };

        // ── Event Listeners ───────────────────────────────────────────

        qa('.peptide-calc-option-buttons').forEach(function (bg) {
            var field = bg.dataset.field;
            bg.querySelectorAll('.peptide-calc-option-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    bg.querySelectorAll('.peptide-calc-option-btn').forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    var value   = btn.dataset.value;
                    var isOther = value === 'other';
                    state[field + 'Custom'] = isOther;
                    var cw = root.querySelector('#pc-' + field + 'Custom');
                    if (isOther) {
                        cw.classList.add('show');
                        setTimeout(function () {
                            var inp = root.querySelector('#pc-' + field + 'Input');
                            if (inp) { inp.value = ''; inp.focus(); }
                        }, 100);
                        state[field] = null;
                        updateConv(field);
                    } else {
                        cw.classList.remove('show');
                        state[field] = parseFloat(value);
                        var inp = root.querySelector('#pc-' + field + 'Input');
                        if (inp) inp.value = '';
                        updateConv(field, parseFloat(value));
                    }
                    calc();
                });
            });
        });

        qa('.peptide-calc-unit-btn[data-target]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var target      = btn.dataset.target;
                var newUnit     = btn.dataset.unit;
                var currentUnit = target === 'peptide' ? state.peptideUnit : state.desiredDoseUnit;
                if (newUnit === currentUnit) return;

                var field        = target === 'peptide' ? 'peptideAmount' : 'desiredDose';
                var currentValue = state[field];
                var isCustom     = state[field + 'Custom'];

                var tg = btn.closest('.peptide-calc-unit-toggle');
                tg.querySelectorAll('.peptide-calc-unit-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');

                if (target === 'peptide') { state.peptideUnit = newUnit; els.peptideCustomUnit.textContent = newUnit; }
                else                       { state.desiredDoseUnit = newUnit; els.doseCustomUnit.textContent = newUnit; }

                updatePresets(target, newUnit);

                if (currentValue !== null && !isCustom) {
                    var eqVal = newUnit === 'mcg' ? currentValue * 1000 : currentValue / 1000;
                    var bg    = root.querySelector('[data-field="' + field + '"]');
                    var btns  = bg.querySelectorAll('.peptide-calc-option-btn:not([data-value="other"])');
                    var found = false;
                    btns.forEach(function (b) {
                        b.classList.remove('active');
                        if (parseFloat(b.dataset.value) === eqVal) { b.classList.add('active'); state[field] = eqVal; found = true; }
                    });
                    if (!found) { state[field] = null; updateConv(field); }
                    else        { updateConv(field, state[field]); }
                }
                calc();
            });
        });

        els.syringeVolumeInput.addEventListener('input', function () {
            var v = parseFloat(els.syringeVolumeInput.value);
            state.syringeVolume = (isNaN(v) || v <= 0) ? null : v;
            calc();
        });

        els.peptideAmountInput.addEventListener('input', function () {
            var v = parseFloat(els.peptideAmountInput.value);
            state.peptideAmount = (isNaN(v) || v <= 0) ? null : v;
            updateConv('peptideAmount', state.peptideAmount);
            calc();
        });

        els.waterVolumeInput.addEventListener('input', function () {
            var v = parseFloat(els.waterVolumeInput.value);
            state.waterVolume = (isNaN(v) || v <= 0) ? null : v;
            calc();
        });

        els.desiredDoseInput.addEventListener('input', function () {
            var v = parseFloat(els.desiredDoseInput.value);
            state.desiredDose = (isNaN(v) || v <= 0) ? null : v;
            updateConv('desiredDose', state.desiredDose);
            calc();
        });

        els.resetBtn.addEventListener('click', function () { resetCalc(); });

        if (els.concUnitToggle) {
            els.concUnitToggle.querySelectorAll('.peptide-calc-unit-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var newUnit = btn.dataset.unit;
                    if (newUnit === state.concDisplayUnit) return;
                    els.concUnitToggle.querySelectorAll('.peptide-calc-unit-btn').forEach(function (b) { b.classList.remove('active'); });
                    btn.classList.add('active');
                    state.concDisplayUnit = newUnit;
                    calc();
                });
            });
        }

        // ── Helpers ───────────────────────────────────────────────────

        function updateConv(field, value) {
            if (field === 'peptideAmount') {
                var unit = state.peptideUnit;
                var val  = (value !== undefined) ? value : state.peptideAmount;
                if (val === null || isNaN(val)) { els.peptideConversion.classList.add('hidden'); return; }
                els.peptideConversion.textContent = unit === 'mg'
                    ? fmtWhole(val) + ' mg = ' + fmtWhole(val * 1000) + ' mcg'
                    : fmtWhole(val) + ' mcg = ' + fmtWhole(val / 1000) + ' mg';
                els.peptideConversion.classList.remove('hidden');
            } else if (field === 'desiredDose') {
                var unit = state.desiredDoseUnit;
                var val  = (value !== undefined) ? value : state.desiredDose;
                if (val === null || isNaN(val)) { els.doseConversion.classList.add('hidden'); return; }
                els.doseConversion.textContent = unit === 'mg'
                    ? fmtWhole(val) + ' mg = ' + fmtWhole(val * 1000) + ' mcg'
                    : fmtWhole(val) + ' mcg = ' + fmtWhole(val / 1000) + ' mg';
                els.doseConversion.classList.remove('hidden');
            }
        }

        function fmtWhole(num) {
            if (Number.isInteger(num)) return num.toString();
            return parseFloat(num.toFixed(10)).toString();
        }

        function updatePresets(type, unit) {
            var field = type === 'peptide' ? 'peptideAmount' : 'desiredDose';
            var bg    = root.querySelector('[data-field="' + field + '"]');
            var btns  = bg.querySelectorAll('.peptide-calc-option-btn:not([data-value="other"])');
            var data  = presets[type][unit];
            btns.forEach(function (b, i) {
                if (data[i]) { b.dataset.value = data[i].value; b.textContent = data[i].label; b.dataset.unit = unit; }
            });
        }

        function genSyringeSVG(vol) {
            var maxUnits    = vol * 100;
            var majorStep   = maxUnits <= 30 ? 5  : 10;
            var minorStep   = maxUnits <= 30 ? 1  : 2;
            var barrelBottom = 360, barrelHeight = 280;
            var grads = '';

            for (var u = 0; u <= maxUnits; u += majorStep) {
                var y = barrelBottom - (u / maxUnits) * barrelHeight;
                grads += '<line class="peptide-calc-syringe-graduation major" x1="40" y1="' + y + '" x2="55" y2="' + y + '" />';
                grads += '<line class="peptide-calc-syringe-graduation major" x1="65" y1="' + y + '" x2="80" y2="' + y + '" />';
                grads += '<text class="peptide-calc-syringe-graduation-label" x="83" y="' + (y + 3) + '">' + u + '</text>';
            }
            for (var u = minorStep; u < maxUnits; u += minorStep) {
                if (u % majorStep !== 0) {
                    var y = barrelBottom - (u / maxUnits) * barrelHeight;
                    grads += '<line class="peptide-calc-syringe-graduation" x1="45" y1="' + y + '" x2="55" y2="' + y + '" />';
                }
            }

            return '<svg class="peptide-calc-syringe-svg" viewBox="0 0 120 380" xmlns="http://www.w3.org/2000/svg">'
                + '<defs><linearGradient id="pc-liquidGradient" x1="0%" y1="0%" x2="100%" y2="0%">'
                + '<stop offset="0%"   style="stop-color:#2bb3ff;stop-opacity:0.9"/>'
                + '<stop offset="50%"  style="stop-color:#4dcfff;stop-opacity:0.85"/>'
                + '<stop offset="100%" style="stop-color:#2bb3ff;stop-opacity:0.9"/>'
                + '</linearGradient></defs>'
                + '<path class="peptide-calc-syringe-tip" d="M50 360 L50 375 L55 380 L65 380 L70 375 L70 360 Z"/>'
                + '<rect class="peptide-calc-syringe-body"   x="35" y="80"  width="50" height="280" rx="4"/>'
                + '<rect class="peptide-calc-syringe-barrel" x="37" y="82"  width="46" height="276" rx="2"/>'
                + '<g>' + grads + '</g>'
                + '<rect id="pc-syringeLiquid" class="peptide-calc-syringe-liquid" x="39" y="360" width="42" height="0"/>'
                + '<g id="pc-syringePlunger">'
                +   '<rect class="peptide-calc-syringe-rubber"      x="38" y="355" width="44" height="10" rx="2"/>'
                +   '<line class="peptide-calc-syringe-plunger-rod" x1="60" y1="355" x2="60" y2="30"/>'
                +   '<rect class="peptide-calc-syringe-flange"      x="45" y="15"  width="30" height="14" rx="2"/>'
                + '</g>'
                + '</svg>';
        }

        function calc() {
            hideError();
            if (state.syringeVolume === null || state.peptideAmount === null || state.waterVolume === null || state.desiredDose === null) {
                clearRes(); return;
            }
            var pa = state.peptideAmount; if (state.peptideUnit   === 'mcg') pa /= 1000;
            var dd = state.desiredDose;   if (state.desiredDoseUnit === 'mcg') dd /= 1000;
            var wv = state.waterVolume, sv = state.syringeVolume;

            if (pa <= 0 || wv <= 0 || dd <= 0 || sv <= 0) { clearRes(); return; }
            if (dd > pa) { showError('Desired dose cannot exceed total peptide amount'); clearRes(); return; }

            var conc       = pa / wv;
            var injVol     = dd / conc;
            var units      = injVol * 100;
            var totalDoses = Math.floor(pa / dd);

            displayRes(conc, injVol, units, totalDoses);
            updateSyringe(units, sv);
        }

        function displayRes(conc, injVol, units, totalDoses) {
            var displayConc = state.concDisplayUnit === 'mcg' ? conc * 1000 : conc;
            var concValue   = displayConc >= 100 ? displayConc.toFixed(0) : displayConc >= 1 ? displayConc.toFixed(1) : displayConc.toFixed(2);
            els.concentration.textContent   = concValue + ' ' + state.concDisplayUnit + '/ml';
            els.injectionVolume.textContent = injVol.toFixed(2) + ' ml';
            els.totalDoses.textContent      = totalDoses + ' doses';
            var ru = Math.round(units * 10) / 10;
            els.syringeUnitsResult.textContent = ru + ' units';
            els.syringeDisplay.textContent     = ru;
        }

        function clearRes() {
            els.concentration.textContent      = '—';
            els.injectionVolume.textContent    = '—';
            els.totalDoses.textContent         = '—';
            els.syringeUnitsResult.textContent = '—';
            els.syringeDisplay.textContent     = '0';
            els.syringeTypeLabel.textContent   = state.syringeVolume ? state.syringeVolume + ' ml U100 Insulin Syringe' : 'Select syringe volume';
            els.syringeScaleText.textContent   = '';
            els.syringeContainer.innerHTML     = state.syringeVolume ? genSyringeSVG(state.syringeVolume) : '';
        }

        function updateSyringe(units, sv) {
            els.syringeTypeLabel.textContent = sv + ' ml U100 Insulin Syringe';
            var ru = Math.round(units * 10) / 10;
            els.syringeScaleText.innerHTML   = '<strong>' + ru + ' units = ' + (ru / 100).toFixed(2) + ' ml</strong>';
            els.syringeContainer.innerHTML   = genSyringeSVG(sv);

            var liq     = root.querySelector('#pc-syringeLiquid');
            var plunger = root.querySelector('#pc-syringePlunger');
            if (!liq || !plunger) return;

            var maxUnits     = sv * 100;
            var barrelBottom = 360, barrelHeight = 280;
            var fillPct      = Math.min(units, maxUnits) / maxUnits;
            var liqHeight    = barrelHeight * fillPct;
            var liqY         = barrelBottom - liqHeight;

            liq.setAttribute('y', liqY);
            liq.setAttribute('height', liqHeight);

            var offset = liqY - 355;
            plunger.querySelectorAll('*').forEach(function (el) {
                var cy  = parseFloat(el.getAttribute('y'));
                var cy2 = el.getAttribute('y2') ? parseFloat(el.getAttribute('y2')) : null;
                if (!isNaN(cy))   el.setAttribute('y',  355 + offset);
                if (cy2 !== null) { el.setAttribute('y2', 355 + offset); el.setAttribute('y1', 30 + offset); }
            });
        }

        function resetCalc() {
            state.syringeVolume = null;    state.syringeVolumeCustom  = false;
            state.peptideAmount = null;    state.peptideUnit          = 'mg';   state.peptideAmountCustom = false;
            state.waterVolume   = null;    state.waterVolumeCustom    = false;
            state.desiredDose   = null;    state.desiredDoseUnit      = 'mg';   state.desiredDoseCustom   = false;
            state.concDisplayUnit = 'mg';

            qa('.peptide-calc-option-btn').forEach(function (b) { b.classList.remove('active'); });
            qa('.peptide-calc-unit-toggle').forEach(function (t) {
                t.querySelectorAll('.peptide-calc-unit-btn').forEach(function (b) {
                    b.classList.remove('active');
                    if (b.dataset.unit === 'mg') b.classList.add('active');
                });
            });

            updatePresets('peptide', 'mg');
            updatePresets('dose',    'mg');

            qa('.peptide-calc-custom-input-wrapper').forEach(function (w) { w.classList.remove('show'); });
            ['syringeVolumeInput','peptideAmountInput','waterVolumeInput','desiredDoseInput'].forEach(function (k) {
                if (els[k]) els[k].value = '';
            });

            els.peptideCustomUnit.textContent = 'mg';
            els.doseCustomUnit.textContent    = 'mg';
            els.peptideConversion.classList.add('hidden');
            els.doseConversion.classList.add('hidden');
            hideError();
            clearRes();
        }

        function showError(msg) { els.errorText.textContent = msg; els.errorMessage.classList.add('show'); }
        function hideError()    { els.errorMessage.classList.remove('show'); }

        // ── Init ──────────────────────────────────────────────────────
        resetCalc();
    }

    // Run on DOMContentLoaded or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPeptideCalculator);
    } else {
        initPeptideCalculator();
    }

})();
