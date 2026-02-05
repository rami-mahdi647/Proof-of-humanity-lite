APP_NAME=poh-lite
VERSION?=v0.1.0
DIST=dist

.PHONY: clean release

clean:
	rm -rf $(DIST)

release: clean
	mkdir -p $(DIST)
	# crea zip excluyendo basura
	zip -r $(DIST)/$(APP_NAME)-$(VERSION).zip . \
		-x "node_modules/*" \
		-x ".git/*" \
		-x "$(DIST)/*" \
		-x ".env" \
		-x "data.sqlite" \
		-x "data/*"
	# checksums
	cd $(DIST) && sha256sum $(APP_NAME)-$(VERSION).zip > SHA256SUMS.txt
	@echo "✅ Release created: $(DIST)/$(APP_NAME)-$(VERSION).zip"
	@echo "✅ Checksums: $(DIST)/SHA256SUMS.txt"
