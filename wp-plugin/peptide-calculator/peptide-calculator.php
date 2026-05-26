<?php
/**
 * Plugin Name:       Peptide Calculator
 * Plugin URI:        https://itsbiohacking.com
 * Description:       Interactive peptide dosage calculator with real-time syringe visualization. Embed anywhere with the shortcode [peptide_calculator].
 * Version:           1.0.0
 * Author:            It's BioHacking
 * Author URI:        https://itsbiohacking.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       peptide-calculator
 * Requires at least: 5.8
 * Requires PHP:      7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Prevent direct file access
}

define( 'IPC_VERSION',    '1.0.0' );
define( 'IPC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'IPC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

// ── Register assets (do NOT enqueue globally — only when shortcode is used) ──

add_action( 'wp_enqueue_scripts', 'ipc_register_assets' );
function ipc_register_assets() {
    wp_register_style(
        'peptide-calculator',
        IPC_PLUGIN_URL . 'assets/peptide-calculator.css',
        array(),
        IPC_VERSION
    );
    wp_register_script(
        'peptide-calculator',
        IPC_PLUGIN_URL . 'assets/peptide-calculator.js',
        array(),       // no jQuery dependency
        IPC_VERSION,
        true           // load in footer
    );
}

// ── Shortcode: [peptide_calculator] ──────────────────────────────────────────

add_shortcode( 'peptide_calculator', 'ipc_render_shortcode' );
function ipc_render_shortcode( $atts ) {

    // Enqueue assets only when the shortcode is actually used
    wp_enqueue_style( 'peptide-calculator' );
    wp_enqueue_script( 'peptide-calculator' );

    // Start output buffer
    ob_start();
    ?>
    <div class="peptide-calc-container" data-pc-init>

        <!-- ── Main Calculator Card ─────────────────────────── -->
        <div class="peptide-calc-main-card">
            <div class="peptide-calc-grid">

                <!-- LEFT: Inputs -->
                <div class="peptide-calc-input-section">

                    <!-- Quick Reference -->
                    <div class="peptide-calc-info-box">
                        <h4>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Quick Reference
                        </h4>
                        <ul class="peptide-calc-info-list">
                            <li>1 mg = 1000 mcg</li>
                            <li>Standard insulin syringes have 100 units = 1 ml</li>
                            <li>Always use bacteriostatic water for peptide reconstitution</li>
                            <li>Store reconstituted peptides in the refrigerator (2&#8211;8&deg;C)</li>
                        </ul>
                    </div>

                    <!-- Syringe Volume -->
                    <div class="peptide-calc-input-group">
                        <div class="peptide-calc-input-header">
                            <div>
                                <div class="peptide-calc-input-title">Syringe Volume</div>
                                <div class="peptide-calc-input-subtitle">What is the total volume of your syringe?</div>
                            </div>
                        </div>
                        <div class="peptide-calc-option-buttons" data-field="syringeVolume">
                            <button class="peptide-calc-option-btn" data-value="0.3">0.3 ml</button>
                            <button class="peptide-calc-option-btn" data-value="0.5">0.5 ml</button>
                            <button class="peptide-calc-option-btn" data-value="1.0">1.0 ml</button>
                            <button class="peptide-calc-option-btn" data-value="other">Other</button>
                        </div>
                        <div class="peptide-calc-custom-input-wrapper" id="pc-syringeVolumeCustom">
                            <label class="peptide-calc-custom-input-label">Enter custom syringe volume</label>
                            <div class="peptide-calc-custom-input-container">
                                <input type="number" class="peptide-calc-custom-input" id="pc-syringeVolumeInput" placeholder="1.0" min="0.1" step="0.1">
                                <span class="peptide-calc-custom-input-unit">ml</span>
                            </div>
                        </div>
                    </div>

                    <!-- Peptide Vial Quantity -->
                    <div class="peptide-calc-input-group">
                        <div class="peptide-calc-input-header">
                            <div>
                                <div class="peptide-calc-input-title">Peptide Vial Quantity</div>
                                <div class="peptide-calc-input-subtitle">How much peptide is in your vial?</div>
                            </div>
                            <div class="peptide-calc-unit-toggle">
                                <button class="peptide-calc-unit-btn active" data-unit="mg"  data-target="peptide">mg</button>
                                <button class="peptide-calc-unit-btn"        data-unit="mcg" data-target="peptide">mcg</button>
                            </div>
                        </div>
                        <div class="peptide-calc-option-buttons" data-field="peptideAmount">
                            <button class="peptide-calc-option-btn" data-value="5"  data-unit="mg">5 mg</button>
                            <button class="peptide-calc-option-btn" data-value="10" data-unit="mg">10 mg</button>
                            <button class="peptide-calc-option-btn" data-value="15" data-unit="mg">15 mg</button>
                            <button class="peptide-calc-option-btn" data-value="30" data-unit="mg">30 mg</button>
                            <button class="peptide-calc-option-btn" data-value="other">Other</button>
                        </div>
                        <div class="peptide-calc-conversion-text hidden" id="pc-peptideConversion"></div>
                        <div class="peptide-calc-custom-input-wrapper" id="pc-peptideAmountCustom">
                            <label class="peptide-calc-custom-input-label">Enter custom peptide amount</label>
                            <div class="peptide-calc-custom-input-container">
                                <input type="number" class="peptide-calc-custom-input" id="pc-peptideAmountInput" placeholder="10" min="0.1" step="0.1">
                                <span class="peptide-calc-custom-input-unit" id="pc-peptideCustomUnit">mg</span>
                            </div>
                        </div>
                    </div>

                    <!-- Bacteriostatic Water -->
                    <div class="peptide-calc-input-group">
                        <div class="peptide-calc-input-header">
                            <div>
                                <div class="peptide-calc-input-title">Bacteriostatic Water</div>
                                <div class="peptide-calc-input-subtitle">How much water are you adding to reconstitute?</div>
                            </div>
                        </div>
                        <div class="peptide-calc-option-buttons" data-field="waterVolume">
                            <button class="peptide-calc-option-btn" data-value="1">1 ml</button>
                            <button class="peptide-calc-option-btn" data-value="2">2 ml</button>
                            <button class="peptide-calc-option-btn" data-value="3">3 ml</button>
                            <button class="peptide-calc-option-btn" data-value="5">5 ml</button>
                            <button class="peptide-calc-option-btn" data-value="other">Other</button>
                        </div>
                        <div class="peptide-calc-custom-input-wrapper" id="pc-waterVolumeCustom">
                            <label class="peptide-calc-custom-input-label">Enter custom water volume</label>
                            <div class="peptide-calc-custom-input-container">
                                <input type="number" class="peptide-calc-custom-input" id="pc-waterVolumeInput" placeholder="2" min="0.1" step="0.1">
                                <span class="peptide-calc-custom-input-unit">ml</span>
                            </div>
                        </div>
                    </div>

                    <!-- Desired Dose -->
                    <div class="peptide-calc-input-group">
                        <div class="peptide-calc-input-header">
                            <div>
                                <div class="peptide-calc-input-title">Desired Dose</div>
                                <div class="peptide-calc-input-subtitle">How much peptide do you want per injection?</div>
                            </div>
                            <div class="peptide-calc-unit-toggle">
                                <button class="peptide-calc-unit-btn active" data-unit="mg"  data-target="dose">mg</button>
                                <button class="peptide-calc-unit-btn"        data-unit="mcg" data-target="dose">mcg</button>
                            </div>
                        </div>
                        <div class="peptide-calc-option-buttons" data-field="desiredDose">
                            <button class="peptide-calc-option-btn" data-value="0.25" data-unit="mg">0.25 mg</button>
                            <button class="peptide-calc-option-btn" data-value="0.5"  data-unit="mg">0.5 mg</button>
                            <button class="peptide-calc-option-btn" data-value="1"    data-unit="mg">1 mg</button>
                            <button class="peptide-calc-option-btn" data-value="2"    data-unit="mg">2 mg</button>
                            <button class="peptide-calc-option-btn" data-value="2.5"  data-unit="mg">2.5 mg</button>
                            <button class="peptide-calc-option-btn" data-value="5"    data-unit="mg">5 mg</button>
                            <button class="peptide-calc-option-btn" data-value="other">Other</button>
                        </div>
                        <div class="peptide-calc-conversion-text hidden" id="pc-doseConversion"></div>
                        <div class="peptide-calc-custom-input-wrapper" id="pc-desiredDoseCustom">
                            <label class="peptide-calc-custom-input-label">Enter custom desired dose</label>
                            <div class="peptide-calc-custom-input-container">
                                <input type="number" class="peptide-calc-custom-input" id="pc-desiredDoseInput" placeholder="0.5" min="0.01" step="0.01">
                                <span class="peptide-calc-custom-input-unit" id="pc-doseCustomUnit">mg</span>
                            </div>
                        </div>
                    </div>

                    <!-- Error -->
                    <div class="peptide-calc-error" id="pc-errorMessage">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;flex-shrink:0">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span id="pc-errorText">Please enter valid values</span>
                    </div>

                    <!-- Reset -->
                    <button class="peptide-calc-reset-btn" id="pc-resetBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Reset Calculator
                    </button>
                </div><!-- /.peptide-calc-input-section -->

                <!-- RIGHT: Results -->
                <div class="peptide-calc-results-section">

                    <!-- Results Card -->
                    <div class="peptide-calc-results-card">
                        <div class="peptide-calc-results-header">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                            </svg>
                            <h3>Calculation Results</h3>
                        </div>

                        <div class="peptide-calc-result-item">
                            <span class="peptide-calc-result-label">Concentration</span>
                            <div style="display:flex;align-items:center;gap:10px">
                                <span class="peptide-calc-result-value" id="pc-concentration">&#8212;</span>
                                <div class="peptide-calc-unit-toggle" id="pc-concUnitToggle" style="padding:2px;gap:2px">
                                    <button class="peptide-calc-unit-btn active" data-unit="mg"  style="padding:6px 12px;font-size:13px">mg</button>
                                    <button class="peptide-calc-unit-btn"        data-unit="mcg" style="padding:6px 12px;font-size:13px">mcg</button>
                                </div>
                            </div>
                        </div>

                        <div class="peptide-calc-result-item">
                            <span class="peptide-calc-result-label">Injection Volume</span>
                            <span class="peptide-calc-result-value" id="pc-injectionVolume">&#8212;</span>
                        </div>

                        <div class="peptide-calc-result-item">
                            <span class="peptide-calc-result-label">Total Doses in Vial</span>
                            <span class="peptide-calc-result-value" id="pc-totalDoses">&#8212;</span>
                        </div>

                        <div class="peptide-calc-result-item">
                            <span class="peptide-calc-result-label">Pull Syringe To</span>
                            <span class="peptide-calc-result-value highlight" id="pc-syringeUnitsResult">&#8212;</span>
                        </div>
                    </div>

                    <!-- Syringe Visual -->
                    <div class="peptide-calc-syringe-section">
                        <div class="peptide-calc-syringe-header">
                            <h3>Visual Guide</h3>
                            <p id="pc-syringeTypeLabel">Select syringe volume</p>
                        </div>
                        <div class="peptide-calc-syringe-units-display">
                            <span class="peptide-calc-syringe-units-value" id="pc-syringeDisplay">0</span>
                            <span class="peptide-calc-syringe-units-label">units</span>
                        </div>
                        <div class="peptide-calc-syringe-scale-text" id="pc-syringeScaleText"></div>
                        <div class="peptide-calc-syringe-container"  id="pc-syringeContainer"></div>
                    </div>

                </div><!-- /.peptide-calc-results-section -->
            </div><!-- /.peptide-calc-grid -->
        </div><!-- /.peptide-calc-main-card -->

        <!-- ── Reconstitution Guide ──────────────────────────── -->
        <div class="peptide-calc-guide-section">
            <div class="peptide-calc-guide-header">
                <h2>Understanding Peptide Reconstitution</h2>
                <p>Follow these steps to properly prepare your peptides for research use.</p>
            </div>
            <div class="peptide-calc-steps-grid">
                <div class="peptide-calc-step-card">
                    <div class="peptide-calc-step-number">1</div>
                    <h3>Prepare Environment</h3>
                    <p>Work in a clean, sterile environment. Use alcohol swabs to clean vial tops and injection sites.</p>
                </div>
                <div class="peptide-calc-step-card">
                    <div class="peptide-calc-step-number">2</div>
                    <h3>Add Solvent</h3>
                    <p>Slowly inject bacteriostatic water into the peptide vial. Aim the stream against the glass wall, not directly at the powder.</p>
                </div>
                <div class="peptide-calc-step-card">
                    <div class="peptide-calc-step-number">3</div>
                    <h3>Storage</h3>
                    <p>Store reconstituted peptides in the refrigerator (2&#8211;8&deg;C). Most remain stable for 2&#8211;4 weeks after reconstitution.</p>
                </div>
            </div>
        </div>

        <!-- ── Disclaimer ────────────────────────────────────── -->
        <div class="peptide-calc-footer">
            <div class="peptide-calc-footer-disclaimer">&#9888;&#65039; Not for human consumption. Research use only.</div>
            <p>This calculator is for research purposes only. Always follow proper laboratory protocols and safety guidelines.</p>
            <p>&copy; <?php echo esc_html( date('Y') ); ?> itsbiohacking.com Peptide Calculator &bull; Built with precision for researchers</p>
        </div>

    </div><!-- /.peptide-calc-container -->
    <?php
    return ob_get_clean();
}
