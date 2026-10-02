#!/usr/bin/env python3
"""Offline negative controls for code-audit reviewer independence (#378)."""
import hashlib
import json
import pathlib
import runpy
import tempfile
import unittest

CHECK = runpy.run_path(str(pathlib.Path(__file__).resolve().parents[1] / 'tools/lint-audit-artifacts'))['check_review_plan']


class ReviewEvidence(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.folder = pathlib.Path(self.tmp.name) / '2026_10_02-milestone-fixture'
        self.root = self.folder / 'second-opinions'
        self.root.mkdir(parents=True)
        self.plan = {
            'schema_version': 1, 'depth': 'independent',
            'primary': {'harness': 'test', 'model': 'openai/gpt-6-astra',
                        'lab': 'openai', 'identity_source': 'offline test fixture'},
            'reviewers': [self.reviewer('claude', 'anthropic', 'claude-fable-5.1', 'xhigh')],
        }

    def reviewer(self, member, lab, name, effort):
        calls = []
        for phase in ('blind', 'refutation'):
            name_out = f'{member}-{phase}.md'
            content = f'Offline fixture only: {member} {phase}\n'.encode()
            (self.root / name_out).write_bytes(content)
            digest = hashlib.sha256(content).hexdigest()
            model = f'{lab}/{name}'
            receipt = {
                'facilitator_version': 'council-facilitator@test-fixture',
                'member': member, 'declared_model': f'{model} (OpenRouter)',
                'output_file_sha256': digest,
                'final': {'outcome': 'success', 'file_artifact_sha256': digest,
                          'verification': {'result': 'PASS', 'observed': model,
                                           'model_identity_source': 'provider_response'},
                          'effort_verification': {'result': 'PASS', 'declared': effort},
                          'provider_verification': {'result': 'PASS', 'observed_providers': ['OpenAI']}},
            }
            (self.root / (name_out + '.provenance.json')).write_text(json.dumps(receipt))
            calls.append({'phase': phase, 'output': name_out})
        return {'member': member, 'model': model, 'lab': lab, 'effort': effort, 'calls': calls}

    def errors(self, milestone=True):
        (self.root / 'review-plan.json').write_text(json.dumps(self.plan))
        errors = []
        CHECK(self.folder, milestone, errors.append, lambda _: None)
        return errors

    def corrupt_receipt(self, mutate):
        f = self.root / 'claude-blind.md.provenance.json'
        receipt = json.loads(f.read_text())
        mutate(receipt)
        f.write_text(json.dumps(receipt))

    def test_openai_primary_anthropic_reviewer(self):
        self.assertEqual([], self.errors())

    def test_anthropic_primary_openai_reviewer(self):
        self.plan['primary'].update(lab='anthropic', model='anthropic/claude-fable-5.1')
        self.plan['reviewers'] = [self.reviewer('gpt', 'openai', 'gpt-6-astra', 'max')]
        self.assertEqual([], self.errors())

    def test_extended_distinct_third_lab(self):
        self.plan['depth'] = 'extended'
        self.plan['reviewers'].append(self.reviewer('gemini', 'google', 'gemini-3.8-flash', 'high'))
        self.assertEqual([], self.errors())

    def test_same_lab_rejected_even_when_model_differs(self):
        self.plan['primary'].update(lab='anthropic', model='anthropic/another-model')
        self.assertTrue(self.errors())

    def test_third_reviewer_cannot_repeat_primary_lab(self):
        self.plan['depth'] = 'extended'
        self.plan['reviewers'].append(self.reviewer('gpt', 'openai', 'gpt-6-astra', 'max'))
        self.assertTrue(self.errors())

    def test_unknown_primary_lab(self):
        self.plan['primary'].update(lab='unknown', model='unknown')
        self.assertTrue(self.errors())

    def test_missing_pass(self):
        self.plan['reviewers'][0]['calls'].pop()
        self.assertTrue(self.errors())

    def test_one_output_cannot_count_as_both_passes(self):
        self.plan['reviewers'][0]['calls'][1]['output'] = 'claude-blind.md'
        self.assertTrue(self.errors())

    def test_served_model_mismatch_despite_pass_label(self):
        self.corrupt_receipt(lambda r: r['final']['verification'].update(observed='openai/gpt-6-astra'))
        self.assertTrue(self.errors())

    def test_dated_alias_after_semantic_verification(self):
        self.corrupt_receipt(lambda r: r['final']['verification'].update(
            observed='anthropic/claude-fable-5.1-20260831'))
        self.assertEqual([], self.errors())

    def test_gpt_outside_provider_pin(self):
        self.plan['primary'].update(lab='anthropic', model='anthropic/claude-fable-5.1')
        self.plan['reviewers'] = [self.reviewer('gpt', 'openai', 'gpt-6-astra', 'max')]
        f = self.root / 'gpt-blind.md.provenance.json'
        r = json.loads(f.read_text())
        r['final']['provider_verification']['observed_providers'] = ['Different host']
        f.write_text(json.dumps(r))
        self.assertTrue(self.errors())

    def test_unverified_outcome(self):
        self.corrupt_receipt(lambda r: r['final'].update(outcome='model_mismatch_no_retry'))
        self.assertTrue(self.errors())

    def test_missing_facilitator(self):
        self.corrupt_receipt(lambda r: r.pop('facilitator_version'))
        self.assertTrue(self.errors())

    def test_modified_output(self):
        (self.root / 'claude-blind.md').write_text('Altered fixture\n')
        self.assertTrue(self.errors())

    def test_missing_receipt(self):
        (self.root / 'claude-blind.md.provenance.json').unlink()
        self.assertTrue(self.errors())

    def test_wrong_effort(self):
        self.corrupt_receipt(lambda r: r['final']['effort_verification'].update(declared='max'))
        self.assertTrue(self.errors())

    def test_local_cannot_close_milestone(self):
        self.plan.update(depth='local', reviewers=[])
        self.assertTrue(self.errors())

    def test_local_issue_needs_no_external_receipt(self):
        self.folder = self.folder.with_name('2026_10_02-issue-fixture')
        self.root = self.folder / 'second-opinions'
        self.root.mkdir(parents=True)
        self.plan.update(depth='local', reviewers=[])
        self.assertEqual([], self.errors(milestone=False))

    def test_epic_needs_only_refutation(self):
        self.plan['reviewers'][0]['calls'] = self.plan['reviewers'][0]['calls'][1:]
        self.assertEqual([], self.errors(milestone=False))


if __name__ == '__main__':
    unittest.main()
