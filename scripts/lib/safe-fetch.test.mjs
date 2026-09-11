import { test } from "node:test";
import assert from "node:assert/strict";
import { isPrivateIp, safeFetchJson } from "./safe-fetch.mjs";

test("isPrivateIp recusa faixas privadas/reservadas de IPv4", () => {
  assert.equal(isPrivateIp("127.0.0.1"), true);
  assert.equal(isPrivateIp("10.0.0.5"), true);
  assert.equal(isPrivateIp("172.16.5.1"), true);
  assert.equal(isPrivateIp("192.168.1.1"), true);
  assert.equal(isPrivateIp("169.254.169.254"), true); // metadata de nuvem (SSRF clássico)
  assert.equal(isPrivateIp("0.0.0.0"), true);
});

test("isPrivateIp aceita IPs públicos de IPv4", () => {
  assert.equal(isPrivateIp("8.8.8.8"), false);
  assert.equal(isPrivateIp("1.1.1.1"), false);
});

test("isPrivateIp recusa faixas privadas/reservadas de IPv6", () => {
  assert.equal(isPrivateIp("::1"), true);
  assert.equal(isPrivateIp("fc00::1"), true);
  assert.equal(isPrivateIp("fe80::1"), true);
  assert.equal(isPrivateIp("::ffff:127.0.0.1"), true); // IPv4-mapped
});

test("isPrivateIp aceita IPv6 público", () => {
  assert.equal(isPrivateIp("2001:4860:4860::8888"), false);
});

test("safeFetchJson recusa host fora da allow-list sem fazer nenhuma requisição", async () => {
  await assert.rejects(
    () => safeFetchJson("https://evil.example.com/", { allowedHosts: ["api.mercadolibre.com"] }),
    /não está na allow-list/,
  );
});

test("safeFetchJson recusa protocolo não-https", async () => {
  await assert.rejects(
    () => safeFetchJson("http://api.mercadolibre.com/", { allowedHosts: ["api.mercadolibre.com"] }),
    /use https/,
  );
});

test("safeFetchJson exige allowedHosts não vazio", async () => {
  await assert.rejects(() => safeFetchJson("https://api.mercadolibre.com/", {}), /allowedHosts/);
});
